import { config } from 'dotenv';
import { configDefaults, defineConfig } from 'vitest/config';

config({ quiet: true });

export default defineConfig({
  test: {
    environment: 'node',
    clearMocks: true,
    testTimeout: 15000,
    // Empty scaffolds, not completed tests. Remove each exclusion when implementing it.
    exclude: [
      ...configDefaults.exclude,
      'src/modules/auth/auth.test.ts',
      'src/modules/vehicles/vehicle.test.ts',
      'src/modules/inventory/inventory.test.ts',
      'tests/integration/vehicles.test.ts',
      'tests/integration/inventory.test.ts',
    ],
  },
});
