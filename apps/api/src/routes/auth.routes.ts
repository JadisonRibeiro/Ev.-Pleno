import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { findUserByEmail, updateUserPassword } from '../services/users.service.js';
import { findCellByName } from '../services/cells.service.js';
import type { AuthPayload } from '../types/domain.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { hashPassword, isHashed, verifyPassword } from '../lib/password.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
  celula: z.string().min(1),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    const { email, senha, celula } = parsed.data;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const ok = await verifyPassword(senha, user.senha);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Migração silenciosa: se a senha estava em texto puro na planilha,
    // substitui pelo hash bcrypt na primeira autenticação bem-sucedida.
    if (!isHashed(user.senha)) {
      try {
        const newHash = await hashPassword(senha);
        await updateUserPassword(user._row, newHash);
      } catch (err) {
        console.warn('[auth] falha ao migrar senha para hash (segue login):', err);
      }
    }

    const cell = await findCellByName(celula);
    if (!cell) {
      return res.status(401).json({ error: 'Célula não encontrada' });
    }
    // Admin pode entrar em qualquer célula (ativa ou não).
    // Líder só na própria, e apenas se estiver ativa.
    if (user.role !== 'admin') {
      if (user.celula.trim().toLowerCase() !== cell.nome.trim().toLowerCase()) {
        return res.status(403).json({ error: 'Você não é líder desta célula' });
      }
      if (cell.status.trim().toLowerCase() !== 'ativa') {
        return res.status(403).json({ error: 'Esta célula está desativada' });
      }
    }

    const payload: AuthPayload = {
      sub: user.email,
      nome: user.nome,
      role: user.role,
      celula: cell.nome,
    };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: payload });
  }),
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual'),
    senhaNova: z.string().min(8, 'Mínimo de 8 caracteres'),
  })
  .refine((v) => v.senhaAtual !== v.senhaNova, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['senhaNova'],
  });

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    const { senhaAtual, senhaNova } = parsed.data;

    const user = await findUserByEmail(req.user!.sub);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const ok = await verifyPassword(senhaAtual, user.senha);
    if (!ok) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const newHash = await hashPassword(senhaNova);
    await updateUserPassword(user._row, newHash);

    res.json({ ok: true, message: 'Senha alterada com sucesso.' });
  }),
);

export default router;
