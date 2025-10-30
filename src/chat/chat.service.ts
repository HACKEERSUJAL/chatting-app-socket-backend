import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { SendMessageDto } from './dto/SendMessageDto';
import { User } from 'src/user/schema/user.schema';
import { ChatMessage } from './schema/chatMessage.schema';
import { ChatRoom } from './schema/chatRoom.Schema';
import { TotalResult } from './types/chatMessage.Type';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: Model<ChatMessage>,
    @InjectModel(ChatRoom.name)
    private readonly chatRoomModel: Model<ChatRoom>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async saveMessage(data: SendMessageDto) {
    const { senderId, receiverId, content } = data;

    if (!senderId || !receiverId) {
      throw new BadRequestException('senderId and receiverId are required');
    }

    // Convert string IDs to ObjectId
    const senderObjId = new Types.ObjectId(senderId);
    const receiverObjId = new Types.ObjectId(receiverId);

    // Validate users exist
    const [sender, receiver] = await Promise.all([
      this.userModel.findById(senderObjId),
      this.userModel.findById(receiverObjId),
    ]);

    if (!sender) throw new BadRequestException('Sender not found');
    if (!receiver) throw new BadRequestException('Receiver not found');

    // Find or create chatroom
    let chatRoom = await this.chatRoomModel.findOne({
      participantIds: {
        $all: [senderObjId, receiverObjId],
      },
    });

    if (!chatRoom) {
      chatRoom = await this.chatRoomModel.create({
        participantIds: [senderObjId, receiverObjId],
      });
    }

    // Save message
    const message = await this.chatMessageModel.create({
      chatroomId: chatRoom._id,
      senderId: senderObjId,
      receiverId: receiverObjId,
      content,
    });

    // Update lastMessageId in chatroom
    chatRoom.lastMessageId = message._id;
    await chatRoom.save();

    // Populate message for response
    const messageData = await this.chatMessageModel
      .findById(message._id)
      .populate('senderId', 'name _id')
      .populate('receiverId', 'name _id')
      .lean();

    return {
      success: true,
      message: 'Message sent successfully',
      data: messageData,
    };
  }

  async markMessagesAsSeen(senderId: string, receiverId: string) {
    const senderObjId = new Types.ObjectId(senderId);
    const receiverObjId = new Types.ObjectId(receiverId);

    return this.chatMessageModel.updateMany(
      {
        senderId: senderObjId,
        receiverId: receiverObjId,
        isSeen: false,
      },
      { $set: { isSeen: true } },
    );
  }

  async getChatMessages(
    currentUserId: string,
    chatPartnerId: string,
    page = 1,
    limit = 20,
  ) {
    try {
      const currentUserObjId = new Types.ObjectId(currentUserId);
      const chatPartnerObjId = new Types.ObjectId(chatPartnerId);

      const chatRoom = await this.chatRoomModel.findOne({
        participantIds: {
          $all: [currentUserObjId, chatPartnerObjId],
        },
      });

      if (!chatRoom) {
        return {
          totalDocuments: 0,
          currentPage: page,
          totalPages: 0,
          items: [],
        };
      }

      const items = await this.chatMessageModel
        .find({ chatroomId: chatRoom._id })
        .populate('senderId', '_id name')
        .populate('receiverId', '_id name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      const total = await this.chatMessageModel.countDocuments({
        chatroomId: chatRoom._id,
      });

      return {
        totalDocuments: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        items,
      };
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async chatThread(userId: string, searchName: string, page = 1, limit = 20) {
    try {
      const userObjectId = new Types.ObjectId(userId);

      const pipeline: any[] = [
        // 1️⃣ Match chat rooms where the user is a participant
        {
          $match: {
            participantIds: userObjectId,
          },
        },

        // 2️⃣ Lookup last message
        {
          $lookup: {
            from: 'chatmessages',
            localField: 'lastMessageId',
            foreignField: '_id',
            as: 'lastMessage',
          },
        },
        {
          $unwind: {
            path: '$lastMessage',
            preserveNullAndEmptyArrays: true,
          },
        },

        // 3️⃣ Get the other participant (not the current user)
        {
          $addFields: {
            otherParticipantId: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$participantIds',
                    as: 'participantId',
                    cond: { $ne: ['$$participantId', userObjectId] },
                  },
                },
                0,
              ],
            },
          },
        },

        // 4️⃣ Lookup other user details
        {
          $lookup: {
            from: 'users',
            localField: 'otherParticipantId',
            foreignField: '_id',
            as: 'partner',
          },
        },
        {
          $unwind: {
            path: '$partner',
            preserveNullAndEmptyArrays: true,
          },
        },

        // 5️⃣ Count unread messages from the other user
        {
          $lookup: {
            from: 'chatmessages',
            let: {
              roomId: '$_id',
              otherUserId: '$otherParticipantId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chatroomId', '$$roomId'] },
                      { $eq: ['$senderId', '$$otherUserId'] },
                      { $eq: ['$isSeen', false] },
                    ],
                  },
                },
              },
              { $count: 'count' },
            ],
            as: 'unreadMessages',
          },
        },
        {
          $addFields: {
            unreadCount: {
              $ifNull: [{ $arrayElemAt: ['$unreadMessages.count', 0] }, 0],
            },
          },
        },

        // 6️⃣ Filter by search name if provided
        ...(searchName && searchName.trim() !== ''
          ? [
              {
                $match: {
                  'partner.name': {
                    $regex: searchName,
                    $options: 'i',
                  },
                },
              },
            ]
          : []),

        // 7️⃣ Project final fields
        {
          $project: {
            _id: 1,
            partner: {
              _id: '$partner._id',
              name: '$partner.name',
              email: '$partner.email',
              // Add other user fields you need
            },
            lastMessage: {
              _id: '$lastMessage._id',
              content: '$lastMessage.content',
              createdAt: '$lastMessage.createdAt',
              senderId: '$lastMessage.senderId',
            },
            lastMessageDate: '$lastMessage.createdAt',
            unreadCount: 1,
            updatedAt: 1,
          },
        },

        // 8️⃣ Sort by last message date or room update date
        {
          $sort: {
            'lastMessage.createdAt': -1,
          },
        },

        // 9️⃣ Pagination
        { $skip: (page - 1) * limit },
        { $limit: limit + 1 }, // Get one extra to check if there are more
      ];

      const results = await this.chatRoomModel.aggregate(pipeline);

      // Check if there are more results
      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, -1) : results;

      // Get total count for pagination
      const totalPipeline = [
        {
          $match: {
            participantIds: userObjectId,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'participantIds',
            foreignField: '_id',
            as: 'participants',
          },
        },
        {
          $addFields: {
            otherParticipant: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$participants',
                    as: 'participant',
                    cond: { $ne: ['$$participant._id', userObjectId] },
                  },
                },
                0,
              ],
            },
          },
        },
        ...(searchName && searchName.trim() !== ''
          ? [
              {
                $match: {
                  'otherParticipant.name': {
                    $regex: searchName,
                    $options: 'i',
                  },
                },
              },
            ]
          : []),
        { $count: 'total' },
      ];

      const totalResult =
        await this.chatRoomModel.aggregate<TotalResult>(totalPipeline);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      return {
        totalDocuments: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        items,
        hasMore,
      };
    } catch (error) {
      console.error('Error in chatThread:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async searchUsers(searchQuery: string, page = 1, limit = 10) {
    try {
      // Ensure we don't search with empty query
      if (!searchQuery || searchQuery.trim() === '') {
        return {
          totalDocuments: 0,
          currentPage: page,
          totalPages: 0,
          items: [],
        };
      }

      const filter: FilterQuery<User> = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { userName: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
        ],
      };

      const [items, total] = await Promise.all([
        this.userModel
          .find(filter, '_id name email userName profileImage')
          .skip((page - 1) * limit)
          .limit(limit),
        this.userModel.countDocuments(filter),
      ]);

      return {
        totalDocuments: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        items,
      };
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
