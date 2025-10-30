import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findAll(
    filter: FilterQuery<User> = {},
    page = 1,
    limit = 10,
  ): Promise<{
    data: Partial<User>[];
    totalData: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, totalData] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -__v -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: data.map((user) => ({
        ...user,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      totalData,
      page,
      totalPages: Math.ceil(totalData / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    try {
      const data = await this.userModel.findById(id);
      if (!data) throw new Error('User not found');
      return data;
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
