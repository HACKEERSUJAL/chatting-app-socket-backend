import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'ChatRoom', required: true })
  chatroomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isSeen?: boolean;

  @Prop({ type: Boolean, default: false })
  isDeletedBySender?: boolean;

  @Prop({ type: Boolean, default: false })
  isDeletedByReceiver?: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
