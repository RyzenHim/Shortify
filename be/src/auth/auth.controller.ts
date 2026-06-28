import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from './dto/auth.dto';
import type {
  LoginDto,
  RegisterDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/types/authenticated-request.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() dto: RegisterDto) {
    return {
      message: 'Registration successful',
      data: await this.authService.register(dto),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() dto: LoginDto) {
    return {
      message: 'Login successful',
      data: await this.authService.login(dto),
    };
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async adminLogin(@Body() dto: LoginDto) {
    return {
      message: 'Admin login successful',
      data: await this.authService.login(dto, Role.Admin),
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('userId') userId: string,
    @Body('refreshToken') token: string,
  ) {
    return {
      message: 'Token refreshed',
      data: await this.authService.refresh(userId, token),
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: JwtUser) {
    await this.authService.logout(user.sub);
    return { message: 'Logout successful', data: null };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: JwtUser) {
    return { message: 'Authenticated user', data: user };
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return {
      message: 'Profile updated',
      data: await this.authService.updateProfile(user.sub, dto),
    };
  }

  @Patch('preferences')
  @UseGuards(AuthGuard('jwt'))
  async updatePreferences(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(updatePreferencesSchema))
    dto: UpdatePreferencesDto,
  ) {
    return {
      message: 'Preferences updated',
      data: await this.authService.updatePreferences(user.sub, dto),
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(
    @Req()
    req: {
      user: {
        user: unknown;
        accessToken: string;
        refreshToken: string;
      };
    },
    @Res() res: Response,
  ) {
    const params = new URLSearchParams({
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
      user: JSON.stringify(req.user.user),
    });

    return res.redirect(
      `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/auth/callback?${params.toString()}`,
    );
  }
}
