import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { ChatRoomType } from '../types/chatRoom.Type';

@Schema({ timestamps: true })
export class ChatRoom implements ChatRoomType {
  @Prop({ type: [mongoose.Schema.Types.ObjectId], required: true, ref: 'User' })
  participantIds: Types.ObjectId[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    required: false,
  })
  lastMessageId?: Types.ObjectId;
}
export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
