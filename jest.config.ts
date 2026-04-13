import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs", esModuleInterop: true } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/lib/db$": "<rootDir>/__mocks__/prismaClient.ts",
    "^@/generated/prisma$": "<rootDir>/__mocks__/prismaClient.ts",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  extensionsToTreatAsEsm: [],
};

export default config;
