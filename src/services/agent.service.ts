import { AgentModel, AgentFilters } from '../models/agent.model';
import { VehicleModel } from '../models/vehicle.model';
import { CreateAgentDto, UpdateAgentDto, UserPayload, Agent, AgentWithVehicle } from '../types';

export class AgentService {
  static async findAll(filters: AgentFilters, currentUser?: UserPayload) {
    // Non-admin users can only see agents from their own client's vehicles
    // EXCEPTION: Supervisors (2) & Operators (3) or users without client_id (internal staff)
    if (currentUser && !currentUser.is_admin && currentUser.client_id && ![2, 3, '2', '3'].includes(currentUser.role_id as any)) {
      filters.client_id = currentUser.client_id;
    }
    return AgentModel.findAll(filters);
  }

  static async findById(id: number, currentUser?: UserPayload): Promise<AgentWithVehicle> {
    const agent = await AgentModel.findById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Non-admin users can only see agents from their own client's vehicles
    // EXCEPTION: Supervisors (2) & Operators (3) or users without client_id (internal staff)
    if (currentUser && !currentUser.is_admin && currentUser.client_id && ![2, 3, '2', '3'].includes(currentUser.role_id as any)) {
      if (agent.client_id && agent.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    return agent;
  }

  static async create(data: CreateAgentDto, currentUser?: UserPayload): Promise<Agent> {
    // Validate document_id uniqueness if provided
    if (data.document_id) {
      const existingAgent = await AgentModel.findByDocumentId(data.document_id);
      if (existingAgent) {
        throw new Error('Document ID already registered');
      }
    }

    // Validate vehicle_id is an escort vehicle if provided
    if (data.vehicle_id) {
      const vehicle = await VehicleModel.findById(data.vehicle_id);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
      if (!vehicle.is_escort_vehicle) {
        throw new Error('Vehicle must be an escort vehicle');
      }

      // Non-admin users can only assign agents to their own client's vehicles
      // EXCEPTION: Supervisors (2) & Operators (3) or users without client_id (internal staff)
      if (currentUser && !currentUser.is_admin && currentUser.client_id && ![2, 3, '2', '3'].includes(currentUser.role_id as any)) {
        if (vehicle.client_id !== currentUser.client_id) {
          throw new Error('Access denied');
        }
      }
    }

    return AgentModel.create(data, currentUser?.id);
  }

  static async update(id: number, data: UpdateAgentDto, currentUser?: UserPayload): Promise<Agent> {
    const agent = await AgentModel.findById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Non-admin users can only update agents from their own client's vehicles
    // EXCEPTION: Supervisors (2) & Operators (3) or users without client_id (internal staff)
    if (currentUser && !currentUser.is_admin && currentUser.client_id && ![2, 3, '2', '3'].includes(currentUser.role_id as any)) {
      if (agent.client_id && agent.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    // Validate document_id uniqueness if changed
    if (data.document_id && data.document_id !== agent.document_id) {
      const existingAgent = await AgentModel.findByDocumentId(data.document_id);
      if (existingAgent && existingAgent.id !== id) {
        throw new Error('Document ID already in use');
      }
    }

    // Validate vehicle_id is an escort vehicle if changed
    if (data.vehicle_id !== undefined && data.vehicle_id !== agent.vehicle_id) {
      if (data.vehicle_id) {
        const vehicle = await VehicleModel.findById(data.vehicle_id);
        if (!vehicle) {
          throw new Error('Vehicle not found');
        }
        if (!vehicle.is_escort_vehicle) {
          throw new Error('Vehicle must be an escort vehicle');
        }

        // Non-admin users can only assign agents to their own client's vehicles
        // EXCEPTION: Supervisors (2) & Operators (3) or users without client_id (internal staff)
        if (currentUser && !currentUser.is_admin && currentUser.client_id && ![2, 3, '2', '3'].includes(currentUser.role_id as any)) {
          if (vehicle.client_id !== currentUser.client_id) {
            throw new Error('Access denied');
          }
        }
      }
    }

    const updated = await AgentModel.update(id, data, currentUser?.id);
    if (!updated) {
      throw new Error('Failed to update agent');
    }
    return updated;
  }

  static async delete(id: number, currentUser?: UserPayload): Promise<boolean> {
    const agent = await AgentModel.findById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Non-admin users can only delete agents from their own client's vehicles
    // EXCEPTION: Supervisors (2) & Operators (3) or users without client_id (internal staff)
    if (currentUser && !currentUser.is_admin && currentUser.client_id && ![2, 3, '2', '3'].includes(currentUser.role_id as any)) {
      if (agent.client_id && agent.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    return AgentModel.delete(id, currentUser?.id);
  }
}
