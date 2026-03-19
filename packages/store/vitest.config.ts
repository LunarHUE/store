import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      '__tests__/**/*.test.ts?(x)',
      'src/plugins/**/__tests__/*.test.ts?(x)',
    ],
    exclude: ['**/*.native.test.ts?(x)'],
  },
})
