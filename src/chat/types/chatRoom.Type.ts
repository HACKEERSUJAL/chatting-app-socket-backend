import { Types } from 'mongoose';
export interface ChatRoomType {
  participantIds: Types.ObjectId[];
  lastMessageId?: Types.ObjectId; // Reference to the last message in the chat room
}
