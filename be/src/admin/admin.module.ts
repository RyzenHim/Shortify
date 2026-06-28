import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UrlsModule } from '../urls/urls.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UrlsModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
