import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, canAccessCell } from '../middleware/auth.js';
import {
  findCellByName,
  isActive,
  listCells,
  updateCell,
} from '../services/cells.service.js';
import { asyncHandler } from '../lib/async-handler.js';

const router = Router();

router.use(requireAuth);

/**
 * - Admin: vê todas as células (ativas + inativas)
 * - Lider: só a própria, e só se estiver ativa
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const all = await listCells();
    if (req.user!.role === 'admin') return res.json({ cells: all });
    const mine = all.filter(
      (c) =>
        c.nome.trim().toLowerCase() === req.user!.celula.trim().toLowerCase() && isActive(c),
    );
    res.json({ cells: mine });
  }),
);

router.get(
  '/:nome',
  asyncHandler(async (req, res) => {
    const nome = req.params.nome ?? '';
    const cell = await findCellByName(nome);
    if (!cell) return res.status(404).json({ error: 'Célula não encontrada' });
    if (!canAccessCell(req, cell.nome)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    // Líder não vê célula desativada
    if (req.user!.role !== 'admin' && !isActive(cell)) {
      return res.status(403).json({ error: 'Célula desativada' });
    }
    res.json({ cell });
  }),
);

const updateSchema = z.object({
  status: z.string().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  tipo: z.string().optional(),
  cor: z.string().optional(),
});

router.patch(
  '/:nome',
  asyncHandler(async (req, res) => {
    const nome = req.params.nome ?? '';
    const cell = await findCellByName(nome);
    if (!cell) return res.status(404).json({ error: 'Célula não encontrada' });
    if (!canAccessCell(req, cell.nome)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    // Apenas admin pode alterar status (ativar/desativar)
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    const updates = { ...parsed.data };
    if (updates.status !== undefined && req.user!.role !== 'admin') {
      delete updates.status;
    }
    await updateCell(cell._row, updates);
    res.json({ ok: true });
  }),
);

export default router;
