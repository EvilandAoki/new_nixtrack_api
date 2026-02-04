import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt';
import { CreateUserDto, LoginDto, User, UserWithRole } from '../types';

export class AuthService {
  static async register(data: CreateUserDto, createdBy?: number) {
    // Check if email already exists (including inactive users)
    const existingUser = await UserModel.findByEmailIncludeInactive(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await UserModel.create({
      name: data.name,
      email: data.email,
      document_id: data.document_id,
      phone: data.phone,
      client_id: data.client_id,
      position: data.position,
      city_code: data.city_code,
      role_id: data.role_id,
      password_hash,
      created_by: createdBy,
    });

    const userWithRole = user as UserWithRole;
    const token = generateToken({
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      client_id: user.client_id,
      is_admin: userWithRole.is_admin || false,
    });

    return {
      user: this.formatUserResponse(user),
      token,
    };
  }

  static async login(data: LoginDto) {
    const user = await UserModel.findByEmail(data.email) as UserWithRole | null;
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('User account is inactive');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      client_id: user.client_id,
      is_admin: user.is_admin || false,
    });

    return {
      user: this.formatUserResponse(user),
      token,
    };
  }

  private static formatUserResponse(user: User | UserWithRole) {
    const userWithRole = user as UserWithRole;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      document_id: user.document_id,
      phone: user.phone,
      client_id: user.client_id,
      position: user.position,
      city_code: user.city_code,
      role_id: user.role_id,
      role_name: userWithRole.role_name,
      is_admin: userWithRole.is_admin || false,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }
}
