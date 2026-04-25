import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, canAccessCell, requireRole } from '../middleware/auth.js';
import {
  createDecision,
  deleteAmor,
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

const decisionSchema = z.object({
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

const createSchema = decisionSchema.extend({
  nome: z.string().min(2, 'Nome obrigatório'),
});

// Cria decisão — admin grava qualquer opção; líder só cria com sua célula
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    const data = { ...parsed.data };
    if (req.user!.role !== 'admin') {
      data.opcaoCelula = req.user!.celula;
      data.responsavel = data.responsavel || req.user!.nome;
    }
    const decision = await createDecision(data);
    res.status(201).json({ decision });
  }),
);

router.patch(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const d = await findDecisionById(req.params.id ?? '');
    if (!d) return res.status(404).json({ error: 'Decisão não encontrada' });
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    await updateDecision(d._row, parsed.data);
    res.json({ ok: true });
  }),
);

router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const d = await findDecisionById(req.params.id ?? '');
    if (!d) return res.status(404).json({ error: 'Decisão não encontrada' });
    await deleteAmor(d._row);
    res.json({ ok: true });
  }),
);

export default router;
