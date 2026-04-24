import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, canAccessCell, requireRole } from '../middleware/auth.js';
import {
  findAlunoById,
  listAlunos,
  listAlunosByCell,
  updateAluno,
} from '../services/abrigo.service.js';
import { asyncHandler } from '../lib/async-handler.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.user!.role === 'admin') {
      return res.json({ alunos: await listAlunos() });
    }
    res.json({ alunos: await listAlunosByCell(req.user!.celula) });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const a = await findAlunoById(req.params.id ?? '');
    if (!a) return res.status(404).json({ error: 'Aluno não encontrado' });
    if (!canAccessCell(req, a.celula)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json({ aluno: a });
  }),
);

/**
 * Atualiza progresso do aluno — só admin, porque essas colunas
 * podem conter fórmulas na aba `Abrigo_Total` e uma escrita direta
 * substitui a fórmula por valor estático.
 */
const updateSchema = z.object({
  totalLicoes: z.coerce.number().int().min(0).max(10).optional(),
  aulasFeitas: z.string().optional(),
  licoesFaltando: z.coerce.number().int().min(0).max(10).optional(),
  aulasFaltando: z.string().optional(),
  statusConclusao: z.string().optional(),
  progresso: z.string().optional(),
});

router.patch(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const a = await findAlunoById(req.params.id ?? '');
    if (!a) return res.status(404).json({ error: 'Aluno não encontrado' });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    await updateAluno(a._row, parsed.data);
    res.json({ ok: true });
  }),
);

export default router;
