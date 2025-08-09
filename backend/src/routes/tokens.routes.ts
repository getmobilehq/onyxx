import { Router } from 'express';
import { Pool } from 'pg';
import TokensController from '../controllers/tokens.controller';
import { authenticate } from '../middleware/auth.middleware';

const createTokensRouter = (pool: Pool) => {
  const router = Router();
  const tokensController = new TokensController(pool);

  router.post('/create', authenticate, tokensController.createToken);
  router.post('/validate', tokensController.validateToken);
  router.get('/list', authenticate, tokensController.listTokens);
  router.put('/:id/revoke', authenticate, tokensController.revokeToken);

  return router;
};

export default createTokensRouter;