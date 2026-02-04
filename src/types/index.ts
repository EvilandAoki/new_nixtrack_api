import { Request } from 'express';

// User entity matching sys_users table
export interface User {
  id: number;
  name: string;
  email: string;
  document_id: string | null;
  password_hash: string;
  phone: string | null;
  client_id: number | null;
  position: string | null;
  city_code: string | null;
  role_id: number | null;
  is_active: boolean;
  created_at: Date;
  created_by: number | null;
  updated_at: Date;
  updated_by: number | null;
}

// User with role info (for authenticated responses)
export interface UserWithRole extends User {
  role_name?: string;
  is_admin?: boolean;
  client_name?: string;
}

// JWT payload
export interface UserPayload {
  id: number;
  email: string;
  role_id: number | null;
  client_id: number | null;
  is_admin: boolean;
}

// Authenticated request
export interface AuthRequest extends Request {
  user?: UserPayload;
}

// DTO for creating a user
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

// DTO for updating a user
export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  document_id?: string;
  phone?: string;
  client_id?: number;
  position?: string;
  city_code?: string;
  role_id?: number;
  is_active?: boolean;
}

// DTO for login
export interface LoginDto {
  email: string;
  password: string;
}

// Role entity matching sys_roles table
export interface Role {
  id_role: number;
  name: string;
  is_admin: boolean;
}

// Client entity matching sys_clients table
export interface Client {
  id_client: number;
  company_name: string;
  tax_id: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  country_id: string | null;
  city_id: number | null;
  is_active: boolean;
  created_at: Date;
  created_by: number | null;
  updated_at: Date;
  updated_by: number | null;
}

// DTO for creating a client
export interface CreateClientDto {
  company_name: string;
  tax_id: string;
  phone?: string;
  address?: string;
  email?: string;
  country_id?: string;
  city_id?: number;
}

// DTO for updating a client
export interface UpdateClientDto extends Partial<CreateClientDto> {
  is_active?: boolean;
}

// Department entity matching sys_departments table
export interface Department {
  id_department: number;
  code: string;
  name: string;
  country_code: string;
}

// City entity matching sys_cities table
export interface City {
  city_id: number;
  country_code: string;
  department_code: string;
  code: string;
  name: string;
}

// TrackStatus entity matching track_status table
export interface TrackStatus {
  id: number;
  name: string;
}

// Vehicle entity matching track_vehicles table
export interface Vehicle {
  id: number;
  client_id: number;
  license_plate: string;
  brand: string | null;
  vehicle_type: string | null;
  model_year: string | null;
  color: string | null;
  capacity: string | null;
  container: string | null;
  serial_numbers: string | null;
  is_escort_vehicle: boolean;
  is_active: boolean;
  created_at: Date;
  created_by: number | null;
  updated_at: Date;
  updated_by: number | null;
}

// Vehicle with client info
export interface VehicleWithClient extends Vehicle {
  client_name?: string;
}

// DTO for creating a vehicle
export interface CreateVehicleDto {
  client_id: number;
  license_plate: string;
  brand?: string;
  vehicle_type?: string;
  model_year?: string;
  color?: string;
  capacity?: string;
  container?: string;
  serial_numbers?: string;
  is_escort_vehicle?: boolean;
}

// DTO for updating a vehicle
export interface UpdateVehicleDto {
  brand?: string;
  vehicle_type?: string;
  model_year?: string;
  color?: string;
  capacity?: string;
  container?: string;
  serial_numbers?: string;
  is_escort_vehicle?: boolean;
  is_active?: boolean;
}

// Agent entity matching track_agent table
export interface Agent {
  id: number;
  name: string;
  document_id: string | null;
  mobile: string | null;
  vehicle_id: number | null;
  is_active: boolean;
  created_at: Date;
  created_by: number | null;
  updated_at: Date;
  updated_by: number | null;
}

// Agent with vehicle info
export interface AgentWithVehicle extends Agent {
  vehicle_plate?: string;
  client_id?: number;
}

// DTO for creating an agent
export interface CreateAgentDto {
  name: string;
  document_id?: string;
  mobile?: string;
  vehicle_id?: number;
}

// DTO for updating an agent
export interface UpdateAgentDto extends Partial<CreateAgentDto> {
  is_active?: boolean;
}

// Order entity matching track_order table
export interface Order {
  id: number;
  client_id: number;
  vehicle_id: number | null;
  manifest_number: string | null;
  insurance_company: string | null;
  origin_city_code: string | null;
  destination_city_code: string | null;
  route_description: string | null;
  status_level: string | null;
  distance_km: number | null;
  estimated_time: string | null;
  restrictions: string | null;
  tracking_link: string | null;
  notes: string | null;
  created_at: Date;
  departure_at: Date | null;
  arrival_at: Date | null;
  status_id: number | null;
  driver_name: string | null;
  driver_mobile: string | null;
  order_number: string | null;
  escort_id: number | null;
  created_by: number | null;
  updated_at: Date;
  updated_by: number | null;
  is_deleted: boolean;
  deleted_by: number | null;
  deleted_at: Date | null;
}

// Order with related entities
export interface OrderWithDetails extends Order {
  client?: Client;
  vehicle?: Vehicle;
  origin_city?: City;
  destination_city?: City;
  status?: TrackStatus;
  escort?: Agent;
  client_name?: string; // Keep for backward compatibility if needed during migration
  vehicle_plate?: string;
  origin_city_name?: string;
  destination_city_name?: string;
}

// DTO for creating an order
export interface CreateOrderDto {
  client_id: number;
  vehicle_id?: number;
  order_number: string;
  manifest_number?: string;
  insurance_company?: string;
  origin_city_code?: string;
  destination_city_code?: string;
  route_description?: string;
  status_level?: string;
  distance_km?: number;
  estimated_time?: string;
  restrictions?: string;
  tracking_link?: string;
  notes?: string;
  departure_at?: string;
  status_id?: number;
  driver_name?: string;
  driver_mobile?: string;
  escort_id?: number;
}

// DTO for updating an order
export interface UpdateOrderDto extends Partial<Omit<CreateOrderDto, 'client_id' | 'order_number'>> {
  status_level?: string;
}

// DTO for updating order status
export interface UpdateOrderStatusDto {
  status_id: number;
}

// OrderDetail entity matching track_order_detail table
export interface OrderDetail {
  id: number;
  shipment_id: number;
  reported_at: Date;
  reported_by: string | null;
  location_name: string | null;
  sequence_number: number | null;
  notes: string | null;
  updated_at: Date;
  updated_by: number | null;
  latitude: number | null;
  longitude: number | null;
  is_deleted: boolean;
}

// DTO for creating an order detail
export interface CreateOrderDetailDto {
  location_name: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  sequence_number?: number;
}

// DTO for updating an order detail
export interface UpdateOrderDetailDto {
  location_name?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  sequence_number?: number;
}

// VehicleFile entity matching track_vehicle_files table
export interface VehicleFile {
  id: number;
  vehicle_id: number;
  file_name: string;
  description: string | null;
  file_url: string;
  mime_type: string | null;
  is_main_photo: boolean;
  created_by: number | null;
  created_at: Date;
  is_deleted: boolean;
}

// OrderFile entity matching track_order_files table
export interface OrderFile {
  id: number;
  shipment_id: number;
  file_name: string;
  description: string | null;
  file_url: string;
  mime_type: string | null;
  created_by: number | null;
  created_at: Date;
  is_deleted: boolean;
}

// OrderDetailFile entity matching track_order_detail_files table
export interface OrderDetailFile {
  id: number;
  checkpoint_id: number;
  file_name: string;
  description: string | null;
  file_url: string;
  mime_type: string | null;
  created_by: number | null;
  created_at: Date;
  is_deleted: boolean;
}

// Dashboard item for active orders
export interface DashboardItem {
  order: Order;
  client: Client | null;
  vehicle: Vehicle | null;
  origin_city: City | null;
  destination_city: City | null;
  status: TrackStatus | null;
  last_report: {
    id: number;
    reported_at: Date;
    location_name: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

// Pagination options
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

// Paginated result
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
