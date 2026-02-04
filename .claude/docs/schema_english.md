# NixTrack Database Schema (English)

## Overview
This document contains the complete database schema for NixTrack, migrated from Spanish to English naming conventions.

### Naming Conventions
- **Table names**: snake_case, prefix indicates module (sys_ for system, track_ for tracking)
- **Column names**: snake_case
- **Primary keys**: `id` (INT AUTO_INCREMENT) or descriptive `id_*` for lookup tables
- **Foreign keys**: `{table_singular}_id` (e.g., `client_id`, `vehicle_id`)
- **Booleans**: prefix `is_` (e.g., `is_active`, `is_deleted`)
- **Timestamps**: suffix `_at` (e.g., `created_at`, `updated_at`)
- **Audit fields**: `created_by`, `updated_by`, `deleted_by`

---

## Section 1: Database Creation

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS nixtrack
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE nixtrack;
```

---

## Section 2: Tables Without Dependencies

### sys_roles
Stores user roles in the system.

```sql
CREATE TABLE sys_roles (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### sys_departments
Stores geographic departments/states.

```sql
CREATE TABLE sys_departments (
    id_department INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    UNIQUE KEY uk_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### track_status
Stores tracking/shipment statuses.

```sql
CREATE TABLE track_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_status_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Section 3: Tables With Simple Dependencies

### sys_cities
Stores cities linked to departments.

```sql
CREATE TABLE sys_cities (
    city_id INT AUTO_INCREMENT PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL,
    department_code VARCHAR(10) NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_cities_code (code),
    INDEX idx_cities_department (department_code),
    INDEX idx_cities_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### sys_clients
Stores client/company information.

```sql
CREATE TABLE sys_clients (
    id_client INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    email VARCHAR(150),
    country_id VARCHAR(10),
    city_id INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    UNIQUE KEY uk_clients_tax_id (tax_id),
    INDEX idx_clients_city (city_id),
    INDEX idx_clients_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### sys_users
Stores system users.

```sql
CREATE TABLE sys_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    document_id VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    client_id INT,
    position VARCHAR(100),
    city_code VARCHAR(20),
    role_id INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    UNIQUE KEY uk_users_email (email),
    INDEX idx_users_client (client_id),
    INDEX idx_users_role (role_id),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Section 4: Tracking Tables

### track_vehicles
Stores vehicle information for tracking.

```sql
CREATE TABLE track_vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    brand VARCHAR(50),
    vehicle_type VARCHAR(50),
    model_year VARCHAR(10),
    color VARCHAR(30),
    capacity VARCHAR(50),
    container VARCHAR(100),
    serial_numbers TEXT,
    is_escort_vehicle TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    UNIQUE KEY uk_vehicles_plate (license_plate),
    INDEX idx_vehicles_client (client_id),
    INDEX idx_vehicles_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### track_agent
Stores escort/agent information.

```sql
CREATE TABLE track_agent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    document_id VARCHAR(50),
    mobile VARCHAR(50),
    vehicle_id INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    INDEX idx_agent_vehicle (vehicle_id),
    INDEX idx_agent_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### track_order
Main tracking/shipment table.

```sql
CREATE TABLE track_order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    vehicle_id INT,
    manifest_number VARCHAR(100),
    insurance_company VARCHAR(150),
    origin_city_code VARCHAR(20),
    destination_city_code VARCHAR(20),
    route_description TEXT,
    status_level VARCHAR(20),
    distance_km DECIMAL(10,2),
    estimated_time VARCHAR(50),
    restrictions TEXT,
    tracking_link VARCHAR(500),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    departure_at DATETIME,
    arrival_at DATETIME,
    status_id INT,
    driver_name VARCHAR(150),
    driver_mobile VARCHAR(50),
    order_number VARCHAR(100),
    escort_id INT,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_by INT,
    deleted_at DATETIME,
    INDEX idx_order_client (client_id),
    INDEX idx_order_vehicle (vehicle_id),
    INDEX idx_order_status (status_id),
    INDEX idx_order_escort (escort_id),
    INDEX idx_order_origin (origin_city_code),
    INDEX idx_order_destination (destination_city_code),
    INDEX idx_order_deleted (is_deleted),
    INDEX idx_order_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### track_order_detail
Stores checkpoint/detail records for each shipment.

```sql
CREATE TABLE track_order_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    reported_at DATETIME NOT NULL,
    reported_by VARCHAR(150),
    location_name VARCHAR(255),
    sequence_number INT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_detail_shipment (shipment_id),
    INDEX idx_detail_sequence (shipment_id, sequence_number),
    INDEX idx_detail_reported (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Section 5: File Tables

### track_order_detail_files
Stores files attached to checkpoint records.

```sql
CREATE TABLE track_order_detail_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checkpoint_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_detail_files_checkpoint (checkpoint_id),
    INDEX idx_detail_files_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### track_vehicle_files
Stores files attached to vehicles.

```sql
CREATE TABLE track_vehicle_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    is_main_photo TINYINT(1) DEFAULT 0,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_vehicle_files_vehicle (vehicle_id),
    INDEX idx_vehicle_files_main (vehicle_id, is_main_photo),
    INDEX idx_vehicle_files_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### track_order_files
Stores files attached to shipments.

```sql
CREATE TABLE track_order_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_order_files_shipment (shipment_id),
    INDEX idx_order_files_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Section 6: Additional Indexes

```sql
-- Composite indexes for common queries

-- Users: Login lookup
CREATE INDEX idx_users_login ON sys_users(email, is_active);

-- Clients: Search by name
CREATE INDEX idx_clients_search ON sys_clients(company_name, is_active);

-- Vehicles: Search by plate and client
CREATE INDEX idx_vehicles_search ON track_vehicles(client_id, license_plate, is_active);

-- Orders: Common filtering
CREATE INDEX idx_order_filter ON track_order(client_id, status_id, is_deleted, created_at);

-- Orders: Date range queries
CREATE INDEX idx_order_dates ON track_order(departure_at, arrival_at, is_deleted);
```

---

## Section 7: Foreign Keys

```sql
-- sys_clients Foreign Keys
ALTER TABLE sys_clients
    ADD CONSTRAINT fk_clients_city
    FOREIGN KEY (city_id) REFERENCES sys_cities(city_id) ON DELETE SET NULL;

-- sys_users Foreign Keys
ALTER TABLE sys_users
    ADD CONSTRAINT fk_users_client
    FOREIGN KEY (client_id) REFERENCES sys_clients(id_client) ON DELETE SET NULL,
    ADD CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES sys_roles(id_role) ON DELETE SET NULL;

-- track_vehicles Foreign Keys
ALTER TABLE track_vehicles
    ADD CONSTRAINT fk_vehicles_client
    FOREIGN KEY (client_id) REFERENCES sys_clients(id_client) ON DELETE CASCADE;

-- track_agent Foreign Keys
ALTER TABLE track_agent
    ADD CONSTRAINT fk_agent_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES track_vehicles(id) ON DELETE SET NULL;

-- track_order Foreign Keys
ALTER TABLE track_order
    ADD CONSTRAINT fk_order_client
    FOREIGN KEY (client_id) REFERENCES sys_clients(id_client) ON DELETE CASCADE,
    ADD CONSTRAINT fk_order_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES track_vehicles(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_order_status
    FOREIGN KEY (status_id) REFERENCES track_status(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_order_escort
    FOREIGN KEY (escort_id) REFERENCES track_agent(id) ON DELETE SET NULL;

-- track_order_detail Foreign Keys
ALTER TABLE track_order_detail
    ADD CONSTRAINT fk_detail_order
    FOREIGN KEY (shipment_id) REFERENCES track_order(id) ON DELETE CASCADE;

-- track_order_detail_files Foreign Keys
ALTER TABLE track_order_detail_files
    ADD CONSTRAINT fk_detail_files_checkpoint
    FOREIGN KEY (checkpoint_id) REFERENCES track_order_detail(id) ON DELETE CASCADE;

-- track_vehicle_files Foreign Keys
ALTER TABLE track_vehicle_files
    ADD CONSTRAINT fk_vehicle_files_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES track_vehicles(id) ON DELETE CASCADE;

-- track_order_files Foreign Keys
ALTER TABLE track_order_files
    ADD CONSTRAINT fk_order_files_shipment
    FOREIGN KEY (shipment_id) REFERENCES track_order(id) ON DELETE CASCADE;
```

---

## Section 8: Initial Data

### Default Roles

```sql
INSERT INTO sys_roles (name, is_admin) VALUES
('Administrador', 1),
('Supervisor', 0),
('Operador', 0),
('Cliente', 0);
```

### Default Tracking Statuses

```sql
INSERT INTO track_status (name) VALUES
('Pendiente'),
('En Tránsito'),
('En Punto de Control'),
('Entregado'),
('Cancelado'),
('Retrasado'),
('Incidente');
```

---

## Table Mapping Reference

| Old Table Name (Spanish) | New Table Name (English) |
|--------------------------|--------------------------|
| mod_roles | sys_roles |
| mod_departments | sys_departments |
| mod_cities | sys_cities |
| mod_clientes | sys_clients |
| mod_usuarios | sys_users |
| track_estadoseguimiento | track_status |
| track_carros | track_vehicles |
| track_acompanantes | track_agent |
| track_maestroseguimiento | track_order |
| track_detalleseguimiento | track_order_detail |
| track_detalleseguimientoFiles | track_order_detail_files |
| track_carrosFiles | track_vehicle_files |
| track_maestroseguimientoFiles | track_order_files |

---

## Column Mapping Reference

### sys_roles (mod_roles)
| Old Column | New Column |
|------------|------------|
| IdRol | id_role |
| Rol | name |
| isAdminRol | is_admin |

### sys_departments (mod_departments)
| Old Column | New Column |
|------------|------------|
| IdDepartment | id_department |
| DepartmentCode | code |
| DepartmentName | name |
| PaisCode | country_code |

### sys_cities (mod_cities)
| Old Column | New Column |
|------------|------------|
| CityId | city_id |
| PaisCode | country_code |
| DepartmentCode | department_code |
| CityCode | code |
| CityName | name |

### sys_clients (mod_clientes)
| Old Column | New Column |
|------------|------------|
| IdCliente | id_client |
| RazonSocial | company_name |
| Nit | tax_id |
| Telefono | phone |
| Direccion | address |
| Correo | email |
| PaisId | country_id |
| CiudadId | city_id |
| estado | is_active |
| FechaCreacion | created_at |
| UsuarioCreacion | created_by |
| FechaModificacion | updated_at |
| UsuarioModificacion | updated_by |

### sys_users (mod_usuarios)
| Old Column | New Column |
|------------|------------|
| IdUsuario | id |
| Nombre | name |
| Correo | email |
| Identificacion | document_id |
| Password | password_hash |
| Telefono | phone |
| IdCliente | client_id |
| Cargo | position |
| CiudadId | city_code |
| IdRol | role_id |
| estado | is_active |
| FechaCreacion | created_at |
| UsuarioCreacion | created_by |
| FechaModificacion | updated_at |
| UsuarioModificacion | updated_by |

### track_status (track_estadoseguimiento)
| Old Column | New Column |
|------------|------------|
| IdEstado | id |
| NombreEstado | name |

### track_vehicles (track_carros)
| Old Column | New Column |
|------------|------------|
| IdCarro | id |
| IdCliente | client_id |
| Placa | license_plate |
| Marca | brand |
| Clase | vehicle_type |
| Modelo | model_year |
| Color | color |
| Capacidad | capacity |
| Contenedor | container |
| Seriales | serial_numbers |
| isAccompanist | is_escort_vehicle |
| estado | is_active |
| FechaCreacion | created_at |
| UsuarioCreacion | created_by |
| FechaModificacion | updated_at |
| UsuarioModificacion | updated_by |

### track_agent (track_acompanantes)
| Old Column | New Column |
|------------|------------|
| IdAcompanante | id |
| Nombre | name |
| Cedula | document_id |
| Celular | mobile |
| IdVehiculo | vehicle_id |
| estado | is_active |
| FechaCreacion | created_at |
| UsuarioCreacion | created_by |
| FechaModificacion | updated_at |
| UsuarioModificacion | updated_by |

### track_order (track_maestroseguimiento)
| Old Column | New Column |
|------------|------------|
| IdSeguimiento | id |
| IdCliente | client_id |
| IdCarro | vehicle_id |
| Manifiesto | manifest_number |
| Aseguradora | insurance_company |
| IdCiudadOrigen | origin_city_code |
| IdCiudadDestino | destination_city_code |
| Ruta | route_description |
| SemaforoColor | status_level |
| Kilometros | distance_km |
| TiempoEstimado | estimated_time |
| Restriccion | restrictions |
| Link | tracking_link |
| Observacion | notes |
| FechaCreacion | created_at |
| FechaSalida | departure_at |
| FechaLlegada | arrival_at |
| IdEstado | status_id |
| NombreCond | driver_name |
| CelularCond | driver_mobile |
| Orden | order_number |
| IdAcompanante | escort_id |
| UsuarioCreacion | created_by |
| FechaModificacion | updated_at |
| UsuarioModificacion | updated_by |
| isDelete | is_deleted |
| deletedBy | deleted_by |
| deletedOn | deleted_at |

### track_order_detail (track_detalleseguimiento)
| Old Column | New Column |
|------------|------------|
| IdDetSeguimiento | id |
| IdSeguimiento | shipment_id |
| FechaHoraReporte | reported_at |
| Usuario | reported_by |
| PuntoReporte | location_name |
| SN | sequence_number |
| Observacion | notes |
| FechaModificacion | updated_at |
| UsuarioModificacion | updated_by |
| latitude | latitude |
| longitude | longitude |
| isDeleted | is_deleted |

### track_order_detail_files (track_detalleseguimientoFiles)
| Old Column | New Column |
|------------|------------|
| id | id |
| idDetSeguimiento | checkpoint_id |
| name | file_name |
| description | description |
| url | file_url |
| type | mime_type |
| createdBy | created_by |
| createdOn | created_at |
| isDeleted | is_deleted |

### track_vehicle_files (track_carrosFiles)
| Old Column | New Column |
|------------|------------|
| id | id |
| idCarro | vehicle_id |
| name | file_name |
| description | description |
| url | file_url |
| type | mime_type |
| isVehiclePhoto | is_main_photo |
| createdBy | created_by |
| createdOn | created_at |
| isDeleted | is_deleted |

### track_order_files (track_maestroseguimientoFiles)
| Old Column | New Column |
|------------|------------|
| id | id |
| idSeguimiento | shipment_id |
| name | file_name |
| description | description |
| url | file_url |
| type | mime_type |
| createdBy | created_by |
| createdOn | created_at |
| isDeleted | is_deleted |

---

## Complete SQL Script (Execution Order)

```sql
-- =============================================
-- NixTrack Database Schema - Complete Script
-- Execute in MySQL 8.0+
-- =============================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS nixtrack
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE nixtrack;

-- 2. Drop existing tables (if recreating)
-- Uncomment if needed:
-- DROP TABLE IF EXISTS track_order_files;
-- DROP TABLE IF EXISTS track_vehicle_files;
-- DROP TABLE IF EXISTS track_order_detail_files;
-- DROP TABLE IF EXISTS track_order_detail;
-- DROP TABLE IF EXISTS track_order;
-- DROP TABLE IF EXISTS track_agent;
-- DROP TABLE IF EXISTS track_vehicles;
-- DROP TABLE IF EXISTS sys_users;
-- DROP TABLE IF EXISTS sys_clients;
-- DROP TABLE IF EXISTS sys_cities;
-- DROP TABLE IF EXISTS track_status;
-- DROP TABLE IF EXISTS sys_departments;
-- DROP TABLE IF EXISTS sys_roles;

-- 3. Create Tables (in dependency order)

-- sys_roles
CREATE TABLE sys_roles (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_departments
CREATE TABLE sys_departments (
    id_department INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    UNIQUE KEY uk_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- track_status
CREATE TABLE track_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_status_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_cities
CREATE TABLE sys_cities (
    city_id INT AUTO_INCREMENT PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL,
    department_code VARCHAR(10) NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_cities_code (code),
    INDEX idx_cities_department (department_code),
    INDEX idx_cities_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_clients
CREATE TABLE sys_clients (
    id_client INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    email VARCHAR(150),
    country_id VARCHAR(10),
    city_id INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    UNIQUE KEY uk_clients_tax_id (tax_id),
    INDEX idx_clients_city (city_id),
    INDEX idx_clients_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_users
CREATE TABLE sys_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    document_id VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    client_id INT,
    position VARCHAR(100),
    city_code VARCHAR(20),
    role_id INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    UNIQUE KEY uk_users_email (email),
    INDEX idx_users_client (client_id),
    INDEX idx_users_role (role_id),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- track_vehicles
CREATE TABLE track_vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    brand VARCHAR(50),
    vehicle_type VARCHAR(50),
    model_year VARCHAR(10),
    color VARCHAR(30),
    capacity VARCHAR(50),
    container VARCHAR(100),
    serial_numbers TEXT,
    is_escort_vehicle TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    UNIQUE KEY uk_vehicles_plate (license_plate),
    INDEX idx_vehicles_client (client_id),
    INDEX idx_vehicles_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- track_agent
CREATE TABLE track_agent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    document_id VARCHAR(50),
    mobile VARCHAR(50),
    vehicle_id INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    INDEX idx_agent_vehicle (vehicle_id),
    INDEX idx_agent_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- track_order
CREATE TABLE track_order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    vehicle_id INT,
    manifest_number VARCHAR(100),
    insurance_company VARCHAR(150),
    origin_city_code VARCHAR(20),
    destination_city_code VARCHAR(20),
    route_description TEXT,
    status_level VARCHAR(20),
    distance_km DECIMAL(10,2),
    estimated_time VARCHAR(50),
    restrictions TEXT,
    tracking_link VARCHAR(500),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    departure_at DATETIME,
    arrival_at DATETIME,
    status_id INT,
    driver_name VARCHAR(150),
    driver_mobile VARCHAR(50),
    order_number VARCHAR(100),
    escort_id INT,
    created_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_by INT,
    deleted_at DATETIME,
    INDEX idx_order_client (client_id),
    INDEX idx_order_vehicle (vehicle_id),
    INDEX idx_order_status (status_id),
    INDEX idx_order_escort (escort_id),
    INDEX idx_order_origin (origin_city_code),
    INDEX idx_order_destination (destination_city_code),
    INDEX idx_order_deleted (is_deleted),
    INDEX idx_order_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- track_order_detail
CREATE TABLE track_order_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    reported_at DATETIME NOT NULL,
    reported_by VARCHAR(150),
    location_name VARCHAR(255),
    sequence_number INT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_detail_shipment (shipment_id),
    INDEX idx_detail_sequence (shipment_id, sequence_number),
    INDEX idx_detail_reported (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- track_order_detail_files
CREATE TABLE track_order_detail_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checkpoint_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_detail_files_checkpoint (checkpoint_id),
    INDEX idx_detail_files_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- track_vehicle_files
CREATE TABLE track_vehicle_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    is_main_photo TINYINT(1) DEFAULT 0,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_vehicle_files_vehicle (vehicle_id),
    INDEX idx_vehicle_files_main (vehicle_id, is_main_photo),
    INDEX idx_vehicle_files_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- track_order_files
CREATE TABLE track_order_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_order_files_shipment (shipment_id),
    INDEX idx_order_files_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Additional Indexes
CREATE INDEX idx_users_login ON sys_users(email, is_active);
CREATE INDEX idx_clients_search ON sys_clients(company_name, is_active);
CREATE INDEX idx_vehicles_search ON track_vehicles(client_id, license_plate, is_active);
CREATE INDEX idx_order_filter ON track_order(client_id, status_id, is_deleted, created_at);
CREATE INDEX idx_order_dates ON track_order(departure_at, arrival_at, is_deleted);

-- 5. Foreign Keys
ALTER TABLE sys_clients
    ADD CONSTRAINT fk_clients_city
    FOREIGN KEY (city_id) REFERENCES sys_cities(city_id) ON DELETE SET NULL;

ALTER TABLE sys_users
    ADD CONSTRAINT fk_users_client
    FOREIGN KEY (client_id) REFERENCES sys_clients(id_client) ON DELETE SET NULL,
    ADD CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES sys_roles(id_role) ON DELETE SET NULL;

ALTER TABLE track_vehicles
    ADD CONSTRAINT fk_vehicles_client
    FOREIGN KEY (client_id) REFERENCES sys_clients(id_client) ON DELETE CASCADE;

ALTER TABLE track_agent
    ADD CONSTRAINT fk_agent_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES track_vehicles(id) ON DELETE SET NULL;

ALTER TABLE track_order
    ADD CONSTRAINT fk_order_client
    FOREIGN KEY (client_id) REFERENCES sys_clients(id_client) ON DELETE CASCADE,
    ADD CONSTRAINT fk_order_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES track_vehicles(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_order_status
    FOREIGN KEY (status_id) REFERENCES track_status(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_order_escort
    FOREIGN KEY (escort_id) REFERENCES track_agent(id) ON DELETE SET NULL;

ALTER TABLE track_order_detail
    ADD CONSTRAINT fk_detail_order
    FOREIGN KEY (shipment_id) REFERENCES track_order(id) ON DELETE CASCADE;

ALTER TABLE track_order_detail_files
    ADD CONSTRAINT fk_detail_files_checkpoint
    FOREIGN KEY (checkpoint_id) REFERENCES track_order_detail(id) ON DELETE CASCADE;

ALTER TABLE track_vehicle_files
    ADD CONSTRAINT fk_vehicle_files_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES track_vehicles(id) ON DELETE CASCADE;

ALTER TABLE track_order_files
    ADD CONSTRAINT fk_order_files_shipment
    FOREIGN KEY (shipment_id) REFERENCES track_order(id) ON DELETE CASCADE;

-- 6. Initial Data
INSERT INTO sys_roles (name, is_admin) VALUES
('Administrador', 1),
('Supervisor', 0),
('Operador', 0),
('Cliente', 0);

INSERT INTO track_status (name) VALUES
('Pendiente'),
('En Tránsito'),
('En Punto de Control'),
('Entregado'),
('Cancelado'),
('Retrasado'),
('Incidente');

-- =============================================
-- End of Script
-- =============================================
```
