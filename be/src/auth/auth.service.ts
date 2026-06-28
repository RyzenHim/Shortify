import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import type { UserDocument } from '../users/schemas/user.schema';
import type {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    const tokens = await this.issueTokens(user);
    return { user: this.usersService.toSafeUser(user), ...tokens };
  }

  async login(dto: LoginDto, role?: Role) {
    const user = await this.usersService.findByEmail(dto.email, true);

    if (!user) {
      throw new UnauthorizedException(
        'No account found with this email. Please sign up first.',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please continue with Google.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'This account has been disabled. Please contact support.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password does not match.');
    }

    if (role && user.role !== role) {
      throw new UnauthorizedException(
        'This account does not have admin access.',
      );
    }

    const tokens = await this.issueTokens(user);
    return { user: this.usersService.toSafeUser(user), ...tokens };
  }

  async refresh(userId: string, refreshToken: string) {
    const isValid = await this.usersService.isRefreshTokenValid(
      userId,
      refreshToken,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(userId);
    const tokens = await this.issueTokens(user);
    return { user: this.usersService.toSafeUser(user), ...tokens };
  }

  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(userId, dto);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    return this.usersService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  async validateOAuthUser(profile: {
    email: string;
    name: string;
    provider: 'google';
    providerId: string;
  }) {
    const user = await this.usersService.findOrCreateOAuthUser({
      ...profile,
      role: Role.User,
    });
    const tokens = await this.issueTokens(user);
    return { user: this.usersService.toSafeUser(user), ...tokens };
  }

  private async issueTokens(user: UserDocument) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ??
      '15m') as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ??
      '7d') as JwtSignOptions['expiresIn'];
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    await this.usersService.setRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  }
}
