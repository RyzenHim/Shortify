import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UrlsService } from './urls.service';

@Controller()
export class UrlsRedirectController {
  constructor(private readonly urlsService: UrlsService) {}

  @Get(':shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    const originalUrl = await this.urlsService.resolve(shortCode);
    return res.redirect(302, originalUrl);
  }
}
