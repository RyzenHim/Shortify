import { Request } from 'express';
import { Role } from '../enums/role.enum';

export interface JwtUser {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: JwtUser;
}
