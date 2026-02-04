import { ClientModel, ClientFilters } from '../models/client.model';
import { CreateClientDto, UpdateClientDto, UserPayload, Client } from '../types';

export class ClientService {
  static async findAll(filters: ClientFilters, currentUser?: UserPayload) {
    // Non-admin users can only see their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      const client = await ClientModel.findById(currentUser.client_id);
      return {
        data: client ? [client] : [],
        total: client ? 1 : 0,
      };
    }
    return ClientModel.findAll(filters);
  }

  static async findById(id: number, currentUser?: UserPayload): Promise<Client> {
    // Non-admin users can only see their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    const client = await ClientModel.findById(id);
    if (!client) {
      throw new Error('Client not found');
    }
    return client;
  }

  static async create(data: CreateClientDto, createdBy?: number): Promise<Client> {
    // Validate tax_id uniqueness
    const existingClient = await ClientModel.findByTaxIdIncludeInactive(data.tax_id);
    if (existingClient) {
      throw new Error('Tax ID already registered');
    }

    return ClientModel.create(data, createdBy);
  }

  static async update(id: number, data: UpdateClientDto, updatedBy?: number): Promise<Client> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw new Error('Client not found');
    }

    // Validate tax_id uniqueness if changed
    if (data.tax_id && data.tax_id !== client.tax_id) {
      const existingClient = await ClientModel.findByTaxIdIncludeInactive(data.tax_id);
      if (existingClient && existingClient.id_client !== id) {
        throw new Error('Tax ID already in use');
      }
    }

    const updated = await ClientModel.update(id, data, updatedBy);
    if (!updated) {
      throw new Error('Failed to update client');
    }
    return updated;
  }

  static async delete(id: number, deletedBy?: number): Promise<boolean> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw new Error('Client not found');
    }

    return ClientModel.delete(id, deletedBy);
  }
}
