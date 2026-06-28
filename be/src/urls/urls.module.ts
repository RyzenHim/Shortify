import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Url, UrlSchema } from './schemas/url.schema';
import { UrlsController } from './urls.controller';
import { UrlsRedirectController } from './urls-redirect.controller';
import { UrlsService } from './urls.service';
import { PublicUrlsController } from './public-urls.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Url.name, schema: UrlSchema }])],
  controllers: [UrlsController, PublicUrlsController, UrlsRedirectController],
  providers: [UrlsService],
  exports: [UrlsService],
})
export class UrlsModule {}
