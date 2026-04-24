import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, canAccessCell } from '../middleware/auth.js';
import {
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

const updateSchema = z.object({
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

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const member = await findMemberById(req.params.id ?? '');
    if (!member) return res.status(404).json({ error: 'Membro não encontrado' });
    if (!canAccessCell(req, member.celula)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const parsed = updateSchema.safeParse(req.body);
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

export default router;
