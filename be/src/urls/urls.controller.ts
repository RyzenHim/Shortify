import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/types/authenticated-request.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createUrlSchema, updateUrlSchema } from './dto/url.dto';
import type { CreateUrlDto, UpdateUrlDto } from './dto/url.dto';
import { UrlsService } from './urls.service';

@Controller('urls')
@UseGuards(AuthGuard('jwt'))
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createUrlSchema)) dto: CreateUrlDto,
  ) {
    return {
      message: 'Short URL created',
      data: await this.urlsService.create(user.sub, dto),
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: JwtUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return {
      message: 'URLs fetched',
      data: await this.urlsService.findAllForUser(
        user.sub,
        Number(page),
        Number(limit),
      ),
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return {
      message: 'URL fetched',
      data: await this.urlsService.findOneForUser(id, user.sub),
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUrlSchema)) dto: UpdateUrlDto,
  ) {
    return {
      message: 'URL updated',
      data: await this.urlsService.update(id, user.sub, dto),
    };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    await this.urlsService.remove(id, user.sub);
    return { message: 'URL deleted', data: null };
  }
}
