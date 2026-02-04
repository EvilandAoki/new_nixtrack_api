---
name: esbuild-bundler
description: Configure ESBuild for TypeScript backend bundling with optimization, watch mode, and production builds. Use when setting up build pipelines, configuring TypeScript compilation with ESBuild, creating development and production builds, implementing watch mode for development, bundling backend applications, optimizing bundle size, handling external dependencies, or configuring source maps. Triggers include ESBuild configuration, TypeScript bundling, build optimization, watch mode, production builds, bundle analysis, and backend build setup.
---

# ESBuild Bundler

Fast TypeScript bundling for backend applications with ESBuild.

## Why ESBuild

- **Fast**: 10-100x faster than traditional bundlers
- **TypeScript native**: No additional transpilation step
- **Simple**: Minimal configuration needed
- **Production-ready**: Tree-shaking, minification, source maps

## Basic Setup

### Installation
```bash
npm install --save-dev esbuild
```

### Simple Build Script
```typescript
// build.ts
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/main.js',
  format: 'cjs'
});
```

## Development vs Production

### Development Build
```typescript
// scripts/build-dev.ts
import * as esbuild from 'esbuild';

const ctx = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/main.js',
  sourcemap: 'inline',
  minify: false,
  logLevel: 'info'
});

await ctx.watch();
console.log('Watching for changes...');
```

### Production Build
```typescript
// scripts/build-prod.ts
await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/main.js',
  minify: true,
  sourcemap: true,
  treeShaking: true,
  logLevel: 'info',
  metafile: true  // For bundle analysis
});
```

## Configuration Patterns

### External Dependencies
Don't bundle node_modules for backend:

```typescript
import { readFileSync } from 'fs';

const pkg = JSON.parse(
  readFileSync('./package.json', 'utf-8')
);

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
];

await esbuild.build({
  // ...
  external,
  packages: 'external'  // Simpler: mark all packages as external
});
```

### Multiple Entry Points
```typescript
await esbuild.build({
  entryPoints: {
    main: 'src/main.ts',
    worker: 'src/worker.ts',
    migrate: 'scripts/migrate.ts'
  },
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  format: 'cjs'
});
```

### Environment Variables
```typescript
await esbuild.build({
  // ...
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.API_VERSION': '"v1"'
  }
});
```

### Plugins

#### Copy Static Files
```typescript
import { copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const copyPlugin = {
  name: 'copy-files',
  setup(build) {
    build.onEnd(() => {
      const files = [
        'src/graphql/schema/schema.graphql',
        'package.json'
      ];
      
      files.forEach(file => {
        const dest = file.replace('src/', 'dist/');
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(file, dest);
      });
    });
  }
};

await esbuild.build({
  // ...
  plugins: [copyPlugin]
});
```

#### GraphQL Schema Import
```typescript
import { readFileSync } from 'fs';

const graphqlPlugin = {
  name: 'graphql',
  setup(build) {
    build.onLoad({ filter: /\.graphql$/ }, async (args) => {
      const contents = readFileSync(args.path, 'utf-8');
      return {
        contents: `export default ${JSON.stringify(contents)}`,
        loader: 'js'
      };
    });
  }
};
```

## Watch Mode

### Development Server
```typescript
// scripts/dev.ts
import * as esbuild from 'esbuild';
import { spawn } from 'child_process';

let serverProcess;

const ctx = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/main.js',
  sourcemap: 'inline',
  plugins: [{
    name: 'restart-server',
    setup(build) {
      build.onEnd(() => {
        if (serverProcess) {
          serverProcess.kill();
        }
        
        serverProcess = spawn('node', ['dist/main.js'], {
          stdio: 'inherit'
        });
      });
    }
  }]
});

await ctx.watch();
console.log('Dev server running...');
```

## Package.json Scripts

```json
{
  "scripts": {
    "build": "node scripts/build-prod.ts",
    "build:dev": "node scripts/build-dev.ts",
    "dev": "node scripts/dev.ts",
    "start": "node dist/main.js",
    "clean": "rm -rf dist"
  }
}
```

## Monorepo Setup

### Build Multiple Packages
```typescript
// scripts/build-all.ts
const packages = [
  { entry: 'packages/api/src/main.ts', out: 'packages/api/dist' },
  { entry: 'packages/worker/src/main.ts', out: 'packages/worker/dist' },
  { entry: 'packages/shared/src/index.ts', out: 'packages/shared/dist' }
];

await Promise.all(
  packages.map(pkg => 
    esbuild.build({
      entryPoints: [pkg.entry],
      bundle: true,
      platform: 'node',
      outdir: pkg.out,
      packages: 'external'
    })
  )
);
```

## Source Maps

### Development
```typescript
sourcemap: 'inline'  // Embedded in bundle
```

### Production
```typescript
sourcemap: true  // Separate .map file
```

### Debugging
```typescript
sourcemap: 'linked'  // Link to external map
```

## Bundle Analysis

### Generate Metafile
```typescript
const result = await esbuild.build({
  // ...
  metafile: true
});

// Analyze bundle
import fs from 'fs';
fs.writeFileSync('meta.json', JSON.stringify(result.metafile));
```

### Visualize
```bash
npx esbuild-visualizer --metadata meta.json
```

## Optimization

### Tree Shaking
```typescript
treeShaking: true  // Remove unused code
```

### Minification
```typescript
minify: true,
minifyWhitespace: true,
minifyIdentifiers: true,
minifySyntax: true
```

### Target
```typescript
target: 'node18'  // Use modern syntax
```

### Format
```typescript
format: 'esm'  // Modern ES modules (if supported)
format: 'cjs'  // CommonJS (broader compatibility)
```

## Error Handling

### Build Errors
```typescript
try {
  await esbuild.build({
    // ...
    logLevel: 'error'
  });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
```

### Type Checking

ESBuild doesn't type-check. Run TypeScript separately:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && node scripts/build.ts"
  }
}
```

## Integration with Clean Architecture

### Structure-Aware Building
```typescript
await esbuild.build({
  entryPoints: {
    // Main app
    main: 'src/main.ts',
    
    // CLI tools
    'cli/migrate': 'src/infrastructure/database/cli/migrate.ts',
    'cli/seed': 'src/infrastructure/database/cli/seed.ts',
    
    // Workers
    'workers/email': 'src/infrastructure/workers/email-worker.ts'
  },
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  packages: 'external'
});
```

### Path Aliases
```typescript
// Use with tsconfig paths
import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths';

await esbuild.build({
  // ...
  plugins: [TsconfigPathsPlugin()]
});
```

## Docker Build

### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/main.js"]
```

## Common Patterns

### Clean Architecture Bundling
```typescript
// Keep domain/application pure, bundle infrastructure
await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  external: [
    // Keep these as regular imports
    './domain/*',
    './application/*'
  ],
  packages: 'external'
});
```

### GraphQL Code Generation
```typescript
// Run codegen before build
import { execSync } from 'child_process';

execSync('graphql-codegen --config codegen.yml');

await esbuild.build({
  // ... build after codegen
});
```

## Performance Tips

1. **Use watch mode** - Incremental builds are faster
2. **External packages** - Don't bundle node_modules
3. **Source maps** - Only in development
4. **Minify in production** - Only when deploying
5. **Target appropriately** - Match your Node version
6. **Parallel builds** - Build multiple entries concurrently

## Troubleshooting

### Module Resolution
```typescript
// If imports fail, check resolveExtensions
resolveExtensions: ['.ts', '.js', '.json']
```

### Missing Dependencies
```typescript
// Ensure all dependencies are external
packages: 'external'
```

### Path Issues
```typescript
// Use absolute paths for consistency
import { resolve } from 'path';

entryPoints: [resolve(__dirname, '../src/main.ts')]
```

## References

For advanced patterns:
- **Plugin development**: See references/esbuild-plugins.md
- **Advanced optimization**: See references/optimization-strategies.md
- **Monorepo configurations**: See references/monorepo-setup.md
