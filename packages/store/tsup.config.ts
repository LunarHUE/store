import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    'core/index': 'src/core/index.ts',
    'react/index': 'src/react/index.ts',
    'plugins/actions/index': 'src/plugins/actions/index.ts',
    'plugins/persist/index': 'src/plugins/persist/index.ts',
  },
  format: ['esm'],
  sourcemap: true,
  treeshake: true,
})
