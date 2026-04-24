import { Router } from 'express';
import { listActiveCells } from '../services/cells.service.js';
import { asyncHandler } from '../lib/async-handler.js';

const router = Router();

/**
 * Dropdown do login/cadastro: apenas células com Status = Ativa.
 */
router.get(
  '/cells',
  asyncHandler(async (_req, res) => {
    const cells = await listActiveCells();
    res.json({
      cells: cells.map((c) => ({ nome: c.nome })),
    });
  }),
);

export default router;
