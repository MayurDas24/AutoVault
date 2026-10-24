
import { Router } from 'express';
import {
  createLoginController,
  createRegisterController,
  getCurrentUserController,
} from './auth.controller.js';
import {
  createAuthService,
  type AuthDatabase,
  type JwtConfig,
} from './auth.service.js';
import { createAuthenticateMiddleware } from '../../middleware/authenticate.js';

export function createAuthRouter(
  database: AuthDatabase,
  jwtConfig: JwtConfig,
) {
  const router = Router();
  const service = createAuthService(database, jwtConfig);

  router.post('/register', createRegisterController(service));
  router.post('/login', createLoginController(service));

  router.get(
    '/me',
    createAuthenticateMiddleware(database, jwtConfig),
    getCurrentUserController,
  );

  return router;
}
