import { Types } from 'mongoose';
export interface ChatMessageType {
  chatroomId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  isSeen?: boolean;
  isDeletedBySender?: boolean;
  isDeletedByReceiver?: boolean;
}

export interface TotalResult {
  total: number;
}
