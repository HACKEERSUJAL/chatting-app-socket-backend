import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Put,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { catchError, successResponse } from 'src/utils/response.util';
import { ResetPasswordDto, UpdatePasswordDto } from './dto/password-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async create(@Body() createAuthDto: CreateAuthDto) {
    try {
      const user = await this.authService.register(createAuthDto);
      return successResponse('User registered successfully', user, 201);
    } catch (e) {
      return catchError(e);
    }
  }

  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  async userLogin(@Body() loginDto: LoginDto) {
    try {
      const data = await this.authService.userLogin(loginDto);
      return successResponse('User logged in successfully', data, 200);
    } catch (e) {
      return catchError(e);
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    try {
      const result = await this.authService.resetPassword(
        body.token,
        body.newPassword,
      );
      return successResponse('Password Updated Successfully', result);
    } catch (e) {
      return catchError(e);
    }
  }

  @Put('update-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async updatePassword(@Req() req, @Body() data: UpdatePasswordDto) {
    try {
      const result = await this.authService.updatePassword(req.user._id, data);
      return successResponse('Password Updated Successfully', result);
    } catch (e) {
      return catchError(e);
    }
  }
}
