import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { User, UserDocument } from './schemas/user.schema';

interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role?: Role;
  provider?: 'local' | 'google';
  providerId?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    const existing = await this.userModel.exists({ email: input.email });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const password = input.password
      ? await bcrypt.hash(input.password, 12)
      : undefined;

    return this.userModel.create({
      ...input,
      email: input.email.toLowerCase(),
      password,
      role: input.role ?? Role.User,
    });
  }

  async findByEmail(email: string, includePassword = false) {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+password +refreshTokenHash');
    }
    return query.exec();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAllForAdmin(page = 1, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * safeLimit;
    const [items, total] = await Promise.all([
      this.userModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.userModel.countDocuments(),
    ]);

    return {
      items: items.map((user) => this.toSafeUser(user)),
      page,
      limit: safeLimit,
      total,
    };
  }

  async setActiveStatus(userId: string, isActive: boolean) {
    const user = await this.findById(userId);
    user.isActive = isActive;
    await user.save();
    return this.toSafeUser(user);
  }

  async updateProfile(userId: string, input: { name: string }) {
    const user = await this.findById(userId);
    user.name = input.name;
    await user.save();
    return this.toSafeUser(user);
  }

  async updatePreferences(
    userId: string,
    input: {
      theme: 'light' | 'dark';
      accentColor: 'teal' | 'blue' | 'violet' | 'rose' | 'amber';
    },
  ) {
    const user = await this.findById(userId);
    user.theme = input.theme;
    user.accentColor = input.accentColor;
    await user.save();
    return this.toSafeUser(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findById(userId)
      .select('+password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.provider !== 'local' || !user.password) {
      throw new BadRequestException(
        'Google accounts do not use a local password. Please manage your password through Google.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return this.toSafeUser(user);
  }

  async findOrCreateOAuthUser(input: CreateUserInput): Promise<UserDocument> {
    const user = await this.findByEmail(input.email);
    if (user) {
      return user;
    }
    return this.create(input);
  }

  async setRefreshToken(userId: string, refreshToken: string | null) {
    const refreshTokenHash = refreshToken
      ? await bcrypt.hash(refreshToken, 12)
      : undefined;
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
  }

  async isRefreshTokenValid(userId: string, refreshToken: string) {
    const user = await this.userModel
      .findById(userId)
      .select('+refreshTokenHash')
      .exec();

    if (!user?.refreshTokenHash) {
      return false;
    }

    return bcrypt.compare(refreshToken, user.refreshTokenHash);
  }

  toSafeUser(user: UserDocument) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
      isActive: user.isActive,
      theme: user.theme ?? 'dark',
      accentColor: user.accentColor ?? 'teal',
    };
  }
}
