import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { catchError } from 'src/utils/response.util';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UpdatePasswordDto } from './dto/password-auth.dto';
import { User } from 'src/user/schema/user.schema';
import { RoleEnum } from 'src/user/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private jwtService: JwtService,
  ) {}
  async register(createAuthDto: CreateAuthDto): Promise<User> {
    try {
      const existingUser = await this.userModel.findOne({
        email: createAuthDto.email,
      });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }
      const role: RoleEnum = createAuthDto.role ?? RoleEnum.User;

      if (!Object.values(RoleEnum).includes(role)) {
        throw new BadRequestException('Invalid role provided');
      }

      const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);

      const user = await this.userModel.create({
        ...createAuthDto,
        password: hashedPassword,
        role,
      });

      return await user.save();
    } catch (e) {
      throw catchError(e);
    }
  }

  async userLogin(loginDto: LoginDto) {
    try {
      const user = await this.userModel.findOne({ email: loginDto.email });
      if (!user) throw new ConflictException('User with this email not found');

      const match = await bcrypt.compare(loginDto.password, user.password);
      if (!match) throw new ConflictException('Invalid credentials');

      const payload = { sub: user._id.toString() };
      const token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      });

      const { password, ...userWithoutPassword } = user.toObject();

      return { user: userWithoutPassword, token: token };
    } catch (e) {
      throw catchError(e);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await this.userModel.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new BadRequestException(
          'Invalid or expired password reset token',
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return { message: 'Password updated successfully' };
    } catch (e) {
      throw catchError(e);
    }
  }

  async updatePassword(userId: string, data: UpdatePasswordDto) {
    try {
      const { currentPassword, newPassword, confirmPassword } = data;

      if (newPassword !== confirmPassword) {
        throw new BadRequestException(
          'New password and confirm password do not match',
        );
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password ?? '',
      );
      if (!isMatch) {
        throw new BadRequestException('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { password: hashedNewPassword },
        { new: true },
      );

      if (!updatedUser) {
        throw new NotFoundException('User not found after update');
      }

      const { password, ...userWithoutPassword } = updatedUser.toObject();

      return userWithoutPassword;
    } catch (e) {
      throw catchError(e);
    }
  }
}
