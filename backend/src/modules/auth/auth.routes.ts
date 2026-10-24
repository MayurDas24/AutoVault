import { Router } from 'express';
import { createRegisterController } from './auth.controller.js';
import { createAuthService, type AuthDatabase } from './auth.service.js';

export function createAuthRouter(database: AuthDatabase) {
  const router = Router();
  router.post('/register', createRegisterController(createAuthService(database)));
  return router;
}
