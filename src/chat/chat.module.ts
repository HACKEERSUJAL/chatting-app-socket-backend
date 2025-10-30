import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRoom, ChatRoomSchema } from './schema/chatRoom.Schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatMessage, ChatMessageSchema } from './schema/chatMessage.schema';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { User, UserSchema } from 'src/user/schema/user.schema';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  imports: [
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule,
    UserModule,
  ],
})
export class ChatModule {}
