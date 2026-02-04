---
name: backend-api
description: Build production-ready backend APIs using TypeScript, Express, MySQL with Clean Architecture principles. Use when creating REST or GraphQL APIs, organizing backend projects with layered architecture (domain, application, infrastructure, presentation), implementing business logic with use cases, defining domain entities, setting up dependency injection, configuring ESBuild for bundling, or structuring TypeScript backend projects. Triggers include API development, Clean Architecture, hexagonal architecture, domain-driven design, use cases, entities, repositories pattern, dependency inversion, TypeScript backend structure, and Express API.
---

# Backend API - Clean Architecture

Build scalable backend APIs with TypeScript, Express, MySQL using Clean Architecture and ESBuild.

## Architecture Layers

Follow dependency rule: **Domain ← Application ← Infrastructure ← Presentation**

```
domain/         # Enterprise business rules (entities, interfaces)
application/    # Application business rules (use cases)
infrastructure/ # Frameworks & external tools (DB, GraphQL, HTTP)
presentation/   # Controllers & DTOs
```

## Core Workflow

### 1. Define Domain Layer
Start with business entities and repository interfaces. Domain has zero dependencies.

**Entity**: Business object with identity and behavior
**Repository Interface**: Contract for data access (defined here, implemented in infrastructure)

### 2. Implement Use Cases
Business logic orchestration. Depends only on domain layer.

**Use Case**: Single business operation (CreateUser, GetProduct, ProcessOrder)
**Input/Output**: Use DTOs for data transfer

### 3. Build Infrastructure
Implement repository interfaces and external integrations.

**Repository Implementation**: MySQL queries implementing domain interfaces
**GraphQL/REST**: For API type selection, refer to graphql-api and rest-api skills
**Database**: For MySQL patterns, refer to mysql-repository skill

### 4. Create Presentation Layer
Controllers coordinate use cases and handle HTTP/GraphQL concerns.

**Controller**: Receives request → calls use case → returns response
**DTO**: Data validation and transformation

### 5. Configure Build
For ESBuild configuration, bundling strategies, and build optimization, refer to esbuild-bundler skill.

## Dependency Injection

Use constructor injection for all dependencies:

```typescript
// Use case receives dependencies
constructor(private userRepo: IUserRepository) {}

// Controller receives use cases
constructor(private createUser: CreateUserUseCase) {}
```

Wire dependencies in main.ts or use DI container.

## Project Structure

```
src/
├── domain/
│   ├── entities/           # Business models
│   └── repositories/       # Repository interfaces
├── application/
│   └── use-cases/         # Business logic
├── infrastructure/
│   ├── database/          # MySQL implementation
│   ├── graphql/           # GraphQL setup
│   └── http/              # REST routes
├── presentation/
│   ├── controllers/       # Request handlers
│   └── dto/               # Data transfer objects
└── main.ts                # App entry & DI setup
```

## Key Patterns

**Repository Pattern**: Abstract data access behind interfaces
**Use Case Pattern**: Each business operation in its own class
**DTO Pattern**: Separate internal models from API contracts
**Dependency Inversion**: Core depends on abstractions, not implementations

## Integration Points

- **GraphQL setup**: Use graphql-api skill for schema, resolvers, type generation
- **MySQL integration**: Use mysql-repository skill for queries, transactions, pooling  
- **Build configuration**: Use esbuild-bundler skill for compilation, bundling, watch mode
- **REST endpoints**: Standard Express patterns with controller → use case flow

## Testing Strategy

Test each layer independently:
- **Domain**: Pure logic, no mocks needed
- **Use Cases**: Mock repositories
- **Infrastructure**: Integration tests
- **Presentation**: Mock use cases

## References

For detailed patterns and examples:
- **Clean Architecture patterns**: See references/clean-architecture-patterns.md
- **Dependency injection setup**: See references/dependency-injection.md
- **Error handling**: See references/error-handling.md
- **Validation strategies**: See references/validation.md
