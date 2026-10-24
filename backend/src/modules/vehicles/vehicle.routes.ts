import { Router } from 'express';
import type { AuthDatabase, JwtConfig } from '../auth/auth.service.js';
import type { VehicleDatabase } from './vehicle.service.js';
import { createAuthenticateMiddleware } from '../../middleware/authenticate.js';
import { authorizeAdmin } from '../../middleware/authorizeAdmin.js';
import { createVehicleController } from './vehicle.controller.js';
import { createVehicleService } from './vehicle.service.js';

type AppDatabase = AuthDatabase & VehicleDatabase;

export function createVehicleRouter(
  database: AppDatabase,
  jwtConfig: JwtConfig,
) {
  const router = Router();

  const authenticate = createAuthenticateMiddleware(database, jwtConfig);
  const controller = createVehicleController(
    createVehicleService(database),
  );

  // All vehicle endpoints require authentication.
  router.use(authenticate);

  // Vehicle read operations.
  router.get('/search', controller.list);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  // Only administrators can create or update vehicles.
  router.post('/', authorizeAdmin, controller.create);
  router.put('/:id', authorizeAdmin, controller.update);

  // Authenticated users can purchase vehicles.
  router.post('/:id/purchase', controller.purchase);

  // Only administrators can delete or restock vehicles.
  router.delete('/:id', authorizeAdmin, controller.remove);
  router.post('/:id/restock', authorizeAdmin, controller.restock);

  return router;
}
