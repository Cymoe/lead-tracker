#!/usr/bin/env node

// Register TypeScript compiler
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2017',
    lib: ['es2017'],
    moduleResolution: 'node',
    allowSyntheticDefaultImports: true,
    esModuleInterop: true
  }
});

// Run the TypeScript script
require('./fix-all-search-queries.ts');
