import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UrlsService } from './urls.service';

@Controller()
export class UrlsRedirectController {
  constructor(private readonly urlsService: UrlsService) {}

  @Get(':shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    try {
      const originalUrl = await this.urlsService.resolve(shortCode);
      return res.redirect(302, originalUrl);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      if (error?.status === 400 || error?.message?.includes('deactivated')) {
        return res.redirect(`${frontendUrl}?error=inactive`);
      }
      return res.redirect(`${frontendUrl}?error=notfound`);
    }
  }
}
