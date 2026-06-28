import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ trim: true, required: true })
  name: string;

  @Prop({ unique: true, lowercase: true, trim: true, sparse: true })
  email: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ type: String, enum: Role, default: Role.User, index: true })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: ['local', 'google'], default: 'local' })
  provider: 'local' | 'google';

  @Prop()
  providerId?: string;

  @Prop({ select: false })
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ provider: 1, providerId: 1 });
