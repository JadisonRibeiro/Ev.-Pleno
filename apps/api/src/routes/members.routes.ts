import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, canAccessCell, requireRole } from '../middleware/auth.js';
import {
  createMember,
  deleteMember,
  findMemberById,
  listMembers,
  listMembersByCell,
  updateMember,
} from '../services/members.service.js';
import { asyncHandler } from '../lib/async-handler.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.user!.role === 'admin') {
      const members = await listMembers();
      return res.json({ members });
    }
    const members = await listMembersByCell(req.user!.celula);
    res.json({ members });
  }),
);

/**
 * Estatísticas agregadas globais — sem PII.
 * Disponível para qualquer usuário autenticado: líderes precisam destes
 * números para acompanhar a Meta global da igreja.
 */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const all = await listMembers();
    const isYes = (v: string) => v.trim().toLowerCase() === 'sim';
    const total = all.length;
    const batismo = all.filter((m) => isYes(m.batismo)).length;
    const encontro = all.filter((m) => isYes(m.encontroDeus)).length;
    const escola = all.filter((m) => isYes(m.escolaDiscipulos)).length;
    const completo = all.filter(
      (m) => isYes(m.batismo) && isYes(m.encontroDeus) && isYes(m.escolaDiscipulos),
    ).length;
    res.json({ stats: { total, batismo, encontro, escola, completo } });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const member = await findMemberById(req.params.id ?? '');
    if (!member) return res.status(404).json({ error: 'Membro não encontrado' });
    if (!canAccessCell(req, member.celula)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json({ member });
  }),
);

const memberSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  abrigo: z.string().optional(),
  batismo: z.string().optional(),
  encontroDeus: z.string().optional(),
  escolaDiscipulos: z.string().optional(),
  celula: z.string().optional(),
  enderecoBairro: z.string().optional(),
});

const createSchema = memberSchema.extend({
  nome: z.string().min(2, 'Nome obrigatório'),
});

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
    // Líder só pode criar membros na própria célula
    if (req.user!.role !== 'admin') {
      data.celula = req.user!.celula;
    }
    if (!data.celula) {
      return res.status(400).json({ error: 'Célula obrigatória' });
    }
    const member = await createMember(data);
    res.status(201).json({ member });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const member = await findMemberById(req.params.id ?? '');
    if (!member) return res.status(404).json({ error: 'Membro não encontrado' });
    if (!canAccessCell(req, member.celula)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const parsed = memberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }

    const updates = { ...parsed.data };
    if (updates.celula && req.user!.role !== 'admin') {
      delete updates.celula;
    }
    await updateMember(member._row, updates);
    res.json({ ok: true });
  }),
);

router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const member = await findMemberById(req.params.id ?? '');
    if (!member) return res.status(404).json({ error: 'Membro não encontrado' });
    await deleteMember(member._row);
    res.json({ ok: true });
  }),
);

export default router;
