import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserPayload } from '../types';

export function generateToken(payload: UserPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
  };
  // Include all payload fields in the token
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role_id: payload.role_id,
      client_id: payload.client_id,
      is_admin: payload.is_admin,
    },
    env.jwt.secret,
    options
  );
}

export function verifyToken(token: string): UserPayload {
  const decoded = jwt.verify(token, env.jwt.secret) as UserPayload;
  return {
    id: decoded.id,
    email: decoded.email,
    role_id: decoded.role_id ?? null,
    client_id: decoded.client_id ?? null,
    is_admin: decoded.is_admin ?? false,
  };
}
