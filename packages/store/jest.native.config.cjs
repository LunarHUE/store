const swcTransform = [
  '@swc/jest',
  {
    jsc: {
      target: 'es2022',
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
    },
    module: {
      type: 'commonjs',
    },
  },
]

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
  },
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/__tests__/**/*.native.test.ts?(x)',
    '<rootDir>/src/plugins/**/__tests__/*.native.test.ts?(x)',
  ],
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  transform: {
    '^.+\\.(t|j)sx?$': swcTransform,
  },
}
