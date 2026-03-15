import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function workspacePath(relativePath: string) {
  return fileURLToPath(new URL(relativePath, import.meta.url))
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@lunarhue/store/core',
        replacement: workspacePath('../../packages/store/src/core/index.ts'),
      },
      {
        find: '@lunarhue/store/react',
        replacement: workspacePath('../../packages/store/src/react/index.ts'),
      },
      {
        find: '@lunarhue/store/plugins/actions',
        replacement: workspacePath(
          '../../packages/store/src/plugins/actions/index.ts',
        ),
      },
      {
        find: '@lunarhue/store/plugins/persist',
        replacement: workspacePath(
          '../../packages/store/src/plugins/persist/index.ts',
        ),
      },
    ],
  },
})
