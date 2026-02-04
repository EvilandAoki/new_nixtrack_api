---
name: graphql-api
description: Implement GraphQL APIs with TypeScript using schema-first design, resolvers, type safety, and integration with Clean Architecture. Use when building GraphQL endpoints, defining schemas, creating resolvers, implementing queries and mutations, handling GraphQL subscriptions, integrating Apollo Server or GraphQL Yoga, generating TypeScript types from schemas, implementing field resolvers, or adding authentication to GraphQL. Triggers include GraphQL schema, resolvers, mutations, queries, GraphQL server setup, Apollo Server, type-graphql, schema-first GraphQL, and GraphQL subscriptions.
---

# GraphQL API

Build type-safe GraphQL APIs with schema-first design and Clean Architecture integration.

## Schema-First Approach

Define GraphQL schema in .graphql files, generate TypeScript types, implement resolvers.

### Workflow
1. Write schema (.graphql files)
2. Generate TypeScript types (graphql-codegen)
3. Implement resolvers using generated types
4. Wire resolvers to use cases

## Project Structure

```
infrastructure/graphql/
├── schema/
│   ├── user.graphql       # Type definitions
│   ├── product.graphql
│   └── schema.graphql     # Root schema
├── resolvers/
│   ├── UserResolver.ts    # Resolver implementations
│   └── ProductResolver.ts
├── generated/
│   └── types.ts           # Auto-generated types
└── server.ts              # GraphQL server setup
```

## Schema Design

### Type Definitions
Define types, queries, mutations in .graphql files:

```graphql
# schema/user.graphql
type User {
  id: ID!
  email: String!
  name: String!
  createdAt: DateTime!
}

input CreateUserInput {
  email: String!
  password: String!
  name: String!
}

type CreateUserPayload {
  user: User!
}

extend type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
}

extend type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
```

### Root Schema
```graphql
# schema/schema.graphql
type Query {
  _empty: String
}

type Mutation {
  _empty: String
}

scalar DateTime
```

## Type Generation

Use graphql-codegen for TypeScript types:

```yaml
# codegen.yml
schema: "./infrastructure/graphql/schema/**/*.graphql"
generates:
  ./infrastructure/graphql/generated/types.ts:
    plugins:
      - typescript
      - typescript-resolvers
    config:
      useIndexSignature: true
      contextType: "../context#GraphQLContext"
```

Run: `graphql-codegen --config codegen.yml`

## Resolver Implementation

### Resolver Structure
```typescript
// resolvers/UserResolver.ts
import { Resolvers } from '../generated/types';

export const userResolvers: Resolvers = {
  Query: {
    user: async (_, { id }, context) => {
      const user = await context.useCases.getUser.execute({ userId: id });
      return toGraphQLUser(user);
    },

    users: async (_, { limit, offset }, context) => {
      const users = await context.useCases.listUsers.execute({ limit, offset });
      return users.map(toGraphQLUser);
    }
  },

  Mutation: {
    createUser: async (_, { input }, context) => {
      const result = await context.useCases.createUser.execute(input);
      return { user: toGraphQLUser(result) };
    }
  },

  User: {
    // Field resolvers if needed
    posts: async (parent, _, context) => {
      return context.dataloaders.postsByUserId.load(parent.id);
    }
  }
};
```

### Context Setup
```typescript
// context.ts
export interface GraphQLContext {
  useCases: {
    getUser: GetUserUseCase;
    createUser: CreateUserUseCase;
    listUsers: ListUsersUseCase;
  };
  dataloaders: {
    userById: DataLoader<string, User>;
    postsByUserId: DataLoader<string, Post[]>;
  };
  currentUser?: User;
}

export function createContext(req: Request): GraphQLContext {
  return {
    useCases: container.getUseCases(),
    dataloaders: createDataloaders(),
    currentUser: extractUserFromToken(req)
  };
}
```

## Server Setup

### Apollo Server
```typescript
// server.ts
import { ApolloServer } from '@apollo/server';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';

const schema = loadSchemaSync('./schema/**/*.graphql', {
  loaders: [new GraphQLFileLoader()]
});

const server = new ApolloServer({
  schema,
  resolvers: [userResolvers, productResolvers],
  context: ({ req }) => createContext(req)
});
```

### GraphQL Yoga
```typescript
import { createYoga } from 'graphql-yoga';

const yoga = createYoga({
  schema,
  resolvers,
  context: createContext
});
```

## Authentication

### Auth Directive
```graphql
directive @auth(requires: Role = USER) on FIELD_DEFINITION

enum Role {
  USER
  ADMIN
}

type Mutation {
  deleteUser(id: ID!): Boolean! @auth(requires: ADMIN)
}
```

### Implementation
```typescript
export class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field;
    const { requires } = this.args;

    field.resolve = async function (...args) {
      const [, , context] = args;
      
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }

      if (requires && context.currentUser.role !== requires) {
        throw new Error('Insufficient permissions');
      }

      return resolve.apply(this, args);
    };
  }
}
```

## DataLoader Pattern

Solve N+1 query problem with batching:

```typescript
// dataloaders/userLoader.ts
export function createUserLoader(userRepo: IUserRepository) {
  return new DataLoader<string, User>(async (ids) => {
    const users = await userRepo.findByIds(ids);
    const userMap = new Map(users.map(u => [u.id, u]));
    return ids.map(id => userMap.get(id) || null);
  });
}
```

## Error Handling

### Custom Errors
```typescript
export class UserInputError extends GraphQLError {
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, {
      extensions: {
        code: 'USER_INPUT_ERROR',
        ...extensions
      }
    });
  }
}
```

### Error Formatting
```typescript
const server = new ApolloServer({
  formatError: (error) => {
    if (error.originalError instanceof BusinessError) {
      return {
        message: error.message,
        code: 'BUSINESS_ERROR'
      };
    }
    return error;
  }
});
```

## Subscriptions

### Schema
```graphql
type Subscription {
  userCreated: User!
  messageAdded(chatId: ID!): Message!
}
```

### Resolver
```typescript
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

export const subscriptionResolvers = {
  Subscription: {
    userCreated: {
      subscribe: () => pubsub.asyncIterator(['USER_CREATED'])
    }
  }
};

// Publish event
await pubsub.publish('USER_CREATED', { userCreated: user });
```

## Integration with Use Cases

Map GraphQL operations to use cases:

```typescript
// Query → Read Use Case
Query.user → GetUserUseCase
Query.users → ListUsersUseCase

// Mutation → Write Use Case  
Mutation.createUser → CreateUserUseCase
Mutation.updateUser → UpdateUserUseCase

// Subscription → Event Use Case
Subscription.userCreated → UserCreatedEventUseCase
```

## Testing

### Resolver Testing
```typescript
describe('UserResolver', () => {
  it('should get user by id', async () => {
    const mockUseCase = {
      execute: jest.fn().mockResolvedValue(mockUser)
    };

    const result = await userResolvers.Query.user(
      {},
      { id: '123' },
      { useCases: { getUser: mockUseCase } }
    );

    expect(result).toEqual(expect.objectContaining({ id: '123' }));
  });
});
```

## Best Practices

1. **Schema-first**: Always define schema before implementation
2. **Use DataLoader**: Prevent N+1 queries
3. **Field resolvers**: Keep parent resolvers simple
4. **Error handling**: Return meaningful errors
5. **Pagination**: Use cursor-based for large lists
6. **Type safety**: Leverage generated types
7. **Batching**: Group similar operations

## References

For detailed patterns:
- **Advanced resolvers**: See references/resolver-patterns.md
- **Pagination strategies**: See references/pagination.md
- **Subscription patterns**: See references/subscriptions.md
