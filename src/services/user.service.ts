import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { UpdateUserDto, UserPayload } from '../types';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  document_id?: string;
  phone?: string;
  client_id?: number;
  position?: string;
  city_code?: string;
  role_id?: number;
}

export class UserService {
  static async findAll(currentUser?: UserPayload) {
    // If user is not admin, only show users from their client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      return UserModel.findAll(currentUser.client_id);
    }
    return UserModel.findAll();
  }

  static async findAllPaginated(currentUser: UserPayload | undefined, page: number, limit: number, search: string) {
    const clientId = (currentUser && !currentUser.is_admin && currentUser.client_id) ? currentUser.client_id : undefined;
    return UserModel.findPaginated(page, limit, search, clientId);
  }

  static async findById(id: number) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  static async create(data: CreateUserDto, createdBy?: number) {
    // Check if email already exists
    const existingUser = await UserModel.findByEmailIncludeInactive(data.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10);

    // Create user
    return UserModel.create({
      name: data.name,
      email: data.email,
      password_hash,
      document_id: data.document_id,
      phone: data.phone,
      client_id: data.client_id,
      position: data.position,
      city_code: data.city_code,
      role_id: data.role_id,
      created_by: createdBy,
    });
  }

  static async update(id: number, data: UpdateUserDto, updatedBy?: number) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== user.email) {
      const existingUser = await UserModel.findByEmailIncludeInactive(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already in use');
      }
    }

    let password_hash: string | undefined;
    if (data.password) {
      password_hash = await bcrypt.hash(data.password, 10);
    }

    return UserModel.update(id, {
      ...data,
      password_hash,
      updated_by: updatedBy,
    });
  }

  static async delete(id: number, deletedBy?: number) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return UserModel.delete(id, deletedBy);
  }

  static async activate(id: number, updatedBy?: number) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return UserModel.update(id, { is_active: true, updated_by: updatedBy });
  }
}
