import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/SendMessageDto';
import { catchError, successResponse } from 'src/utils/response.util';
import { QueryParamsDto } from 'src/utils/queryParams.util';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async saveMessage(@Body() data: SendMessageDto) {
    console.log(data, ' data in controller before try');
    try {
      console.log(data, 'data in chat controller');
      const result = await this.chatService.saveMessage(data);
      return result;
    } catch (error) {
      return catchError(error);
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async chatThread(@Query() queryParams: QueryParamsDto, @Req() req) {
    const { page = 1, limit = 20, search } = queryParams;

    const result = await this.chatService.chatThread(
      req.user._id,
      search ?? '',
      +page,
      +limit,
    );
    return successResponse('Chat Thread', result);
  }

  @Get('messageList')
  @HttpCode(HttpStatus.OK)
  async getMessages(@Req() req, @Query() queryParams) {
    try {
      const { page = 1, limit = 20, chatPartnerId } = queryParams;
      if (!chatPartnerId) {
        throw new BadRequestException('❌ chatPartnerId is required');
      }

      const currentUserId = req.user._id || req.user.sub;
      console.log('currentUserId', currentUserId);
      const result = await this.chatService.getChatMessages(
        currentUserId,
        chatPartnerId,
        +page,
        +limit,
      );
      return successResponse('Chat Messages fetched succesfully', result);
    } catch (error) {
      return catchError(error);
    }
  }

  @Get('search-users')
  @HttpCode(HttpStatus.OK)
  async searchUsers(@Query() queryParams: QueryParamsDto) {
    try {
      const { search: query, page = 1, limit = 10 } = queryParams;

      const result = await this.chatService.searchUsers(
        query ?? '',
        +page,
        +limit,
      );
      return successResponse('Users fetched successfully', result);
    } catch (error) {
      return catchError(error);
    }
  }
}
