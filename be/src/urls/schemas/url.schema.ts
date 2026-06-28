import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type UrlDocument = HydratedDocument<Url>;

@Schema({ timestamps: true })
export class Url {
  @Prop({ required: true, trim: true })
  originalUrl: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  shortCode: string;

  @Prop({ trim: true })
  title?: string;

  @Prop({ default: 0 })
  clicks: number;

  @Prop({ type: Types.ObjectId, ref: User.name, index: true })
  owner?: Types.ObjectId;

  @Prop({ default: false, index: true })
  isGuest: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const UrlSchema = SchemaFactory.createForClass(Url);
UrlSchema.index({ owner: 1, createdAt: -1 });
