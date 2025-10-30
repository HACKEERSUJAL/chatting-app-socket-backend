import { IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  senderId: string;

  @IsString()
  receiverId: string;

  @IsString()
  content: string;
}
