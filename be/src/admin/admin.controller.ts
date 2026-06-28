import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { UrlsService } from '../urls/urls.service';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(
    private readonly urlsService: UrlsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('urls')
  async urls(@Query('page') page = '1', @Query('limit') limit = '50') {
    return {
      message: 'Admin URLs fetched',
      data: await this.urlsService.findAllForAdmin(Number(page), Number(limit)),
    };
  }

  @Delete('urls/:id')
  async deleteUrl(@Param('id') id: string) {
    await this.urlsService.removeAsAdmin(id);
    return { message: 'Admin URL deleted', data: null };
  }

  @Get('users')
  async users(@Query('page') page = '1', @Query('limit') limit = '50') {
    return {
      message: 'Admin users fetched',
      data: await this.usersService.findAllForAdmin(
        Number(page),
        Number(limit),
      ),
    };
  }

  @Patch('users/:id/disable')
  async disableUser(@Param('id') id: string) {
    return {
      message: 'User disabled',
      data: await this.usersService.setActiveStatus(id, false),
    };
  }

  @Patch('users/:id/enable')
  async enableUser(@Param('id') id: string) {
    return {
      message: 'User enabled',
      data: await this.usersService.setActiveStatus(id, true),
    };
  }
}
