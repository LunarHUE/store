import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/runtime/**/*.test.ts?(x)'],
  },
})
