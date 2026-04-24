import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, canAccessCell, requireRole } from '../middleware/auth.js';
import {
  findDecisionById,
  listDecisions,
  listDecisionsByCell,
  updateDecision,
} from '../services/amor.service.js';
import { asyncHandler } from '../lib/async-handler.js';

const router = Router();
router.use(requireAuth);

/**
 * - Admin: vê todas as decisões
 * - Líder: vê decisões cuja OPÇÃO DE CÉLULA é a dele (follow-up)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.user!.role === 'admin') {
      return res.json({ decisions: await listDecisions() });
    }
    res.json({ decisions: await listDecisionsByCell(req.user!.celula) });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const d = await findDecisionById(req.params.id ?? '');
    if (!d) return res.status(404).json({ error: 'Decisão não encontrada' });
    if (!canAccessCell(req, d.opcaoCelula)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json({ decision: d });
  }),
);

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  decisao: z.string().optional(),
  decidiuNo: z.string().optional(),
  jaEmCelula: z.string().optional(),
  responsavel: z.string().optional(),
  dataNascimento: z.string().optional(),
  tipoCelulaInteresse: z.string().optional(),
  bairro: z.string().optional(),
  convidadoPor: z.string().optional(),
  idade: z.string().optional(),
  opcaoCelula: z.string().optional(),
});

// Edição só por admin (dados sensíveis de decisão pastoral)
router.patch(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const d = await findDecisionById(req.params.id ?? '');
    if (!d) return res.status(404).json({ error: 'Decisão não encontrada' });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    await updateDecision(d._row, parsed.data);
    res.json({ ok: true });
  }),
);

export default router;
