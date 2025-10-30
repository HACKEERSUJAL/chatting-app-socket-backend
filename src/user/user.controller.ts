import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { userQueryParamsDto } from './dto/user-queryParams-dto';
import { FilterQuery } from 'mongoose';
import { User } from './schema/user.schema';
import { catchError, successResponse } from 'src/utils/response.util';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: userQueryParamsDto) {
    try {
      const { page = 1, limit = 10, name } = query;

      let filter: FilterQuery<User> = {};

      if (name) {
        const names = name.split(',').map((n) => n.trim());
        filter = {
          $or: names.map((n) => ({
            name: { $regex: n, $options: 'i' },
          })),
        };
      }

      const result = await this.userService.findAll(filter, +page, +limit);
      return successResponse('Users fetched successfully', {
        data: result.data,
        totalData: result.totalData,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (e) {
      return catchError(e);
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.userService.findOne(id);
      if (!data) throw new Error('User not found');
      return successResponse('User fetched successfully', data);
    } catch (e) {
      return catchError(e);
    }
  }
}
