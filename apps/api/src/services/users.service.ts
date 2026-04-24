import { readSheet, updateRow } from '../lib/sheets.js';
import { TTLCache } from '../lib/cache.js';
import { SHEETS } from '../config.js';
import { USER_COLUMNS, type LeaderUser, type Role } from '../types/domain.js';

const cache = new TTLCache<LeaderUser[]>(30_000);

function parseRole(raw: string): Role {
  return raw.trim().toLowerCase() === 'admin' ? 'admin' : 'lider';
}

type SheetUser = Record<string, string> & { _row: number };

function rowToUser(row: SheetUser): LeaderUser {
  return {
    _row: row._row,
    nome: (row[USER_COLUMNS.nome] ?? '').trim(),
    celula: (row[USER_COLUMNS.celula] ?? '').trim(),
    email: (row[USER_COLUMNS.email] ?? '').trim(),
    senha: row[USER_COLUMNS.senha] ?? '',
    role: parseRole(row[USER_COLUMNS.permissao] ?? ''),
  };
}

export async function listUsers(): Promise<LeaderUser[]> {
  const cached = cache.get('all');
  if (cached) return cached;
  const rows = await readSheet<SheetUser>(SHEETS.usuarios);
  const users = rows.map(rowToUser);
  cache.set('all', users);
  return users;
}

export async function findUserByEmail(email: string): Promise<LeaderUser | undefined> {
  const normalized = email.trim().toLowerCase();
  const users = await listUsers();
  return users.find((u) => u.email.trim().toLowerCase() === normalized);
}

export async function updateUserPassword(row: number, senha_hash: string): Promise<void> {
  await updateRow(SHEETS.usuarios, row, { [USER_COLUMNS.senha]: senha_hash });
  cache.invalidate();
}
