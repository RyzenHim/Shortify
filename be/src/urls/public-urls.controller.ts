import { Body, Controller, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createGuestUrlSchema } from './dto/url.dto';
import type { CreateGuestUrlDto } from './dto/url.dto';
import { UrlsService } from './urls.service';

@Controller('public/urls')
export class PublicUrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createGuestUrlSchema)) dto: CreateGuestUrlDto,
  ) {
    return {
      message: 'Short URL created',
      data: await this.urlsService.createGuest(dto),
    };
  }
}
