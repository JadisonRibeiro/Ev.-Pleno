import { appendRow, deleteRow, readSheet, updateRow } from '../lib/sheets.js';
import { TTLCache } from '../lib/cache.js';
import { SHEETS } from '../config.js';
import { MEMBER_COLUMNS, type Member } from '../types/domain.js';

const cache = new TTLCache<Member[]>(15_000);

type SheetRow = Record<string, string> & { _row: number };

function rowToMember(row: SheetRow): Member {
  return {
    _row: row._row,
    id: `m-${row._row}`,
    dataCadastro: (row[MEMBER_COLUMNS.dataCadastro] ?? '').trim(),
    nome: (row[MEMBER_COLUMNS.nome] ?? '').trim(),
    telefone: (row[MEMBER_COLUMNS.telefone] ?? '').trim(),
    dataNascimento: (row[MEMBER_COLUMNS.dataNascimento] ?? '').trim(),
    endereco: (row[MEMBER_COLUMNS.endereco] ?? '').trim(),
    bairro: (row[MEMBER_COLUMNS.bairro] ?? '').trim(),
    abrigo: (row[MEMBER_COLUMNS.abrigo] ?? '').trim(),
    batismo: (row[MEMBER_COLUMNS.batismo] ?? '').trim(),
    encontroDeus: (row[MEMBER_COLUMNS.encontroDeus] ?? '').trim(),
    escolaDiscipulos: (row[MEMBER_COLUMNS.escolaDiscipulos] ?? '').trim(),
    celula: (row[MEMBER_COLUMNS.celula] ?? '').trim(),
    enderecoBairro: (row[MEMBER_COLUMNS.enderecoBairro] ?? '').trim(),
  };
}

function parseMemberId(id: string): number | null {
  const match = id.match(/^m-(\d+)$/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n >= 2 ? n : null;
}

export async function listMembers(): Promise<Member[]> {
  const cached = cache.get('all');
  if (cached) return cached;
  const rows = await readSheet<SheetRow>(SHEETS.membros);
  const members = rows.map(rowToMember).filter((m) => m.nome);
  cache.set('all', members);
  return members;
}

export async function listMembersByCell(cellName: string): Promise<Member[]> {
  const normalized = cellName.trim().toLowerCase();
  const all = await listMembers();
  return all.filter((m) => m.celula.trim().toLowerCase() === normalized);
}

export async function findMemberById(id: string): Promise<Member | undefined> {
  const row = parseMemberId(id);
  if (!row) return undefined;
  const all = await listMembers();
  return all.find((m) => m._row === row);
}

export async function updateMember(
  row: number,
  updates: Partial<Omit<Member, '_row' | 'id' | 'dataCadastro'>>,
): Promise<void> {
  const raw: Record<string, string | undefined> = {};
  if (updates.nome !== undefined) raw[MEMBER_COLUMNS.nome] = updates.nome;
  if (updates.telefone !== undefined) raw[MEMBER_COLUMNS.telefone] = updates.telefone;
  if (updates.dataNascimento !== undefined)
    raw[MEMBER_COLUMNS.dataNascimento] = updates.dataNascimento;
  if (updates.endereco !== undefined) raw[MEMBER_COLUMNS.endereco] = updates.endereco;
  if (updates.bairro !== undefined) raw[MEMBER_COLUMNS.bairro] = updates.bairro;
  if (updates.abrigo !== undefined) raw[MEMBER_COLUMNS.abrigo] = updates.abrigo;
  if (updates.batismo !== undefined) raw[MEMBER_COLUMNS.batismo] = updates.batismo;
  if (updates.encontroDeus !== undefined)
    raw[MEMBER_COLUMNS.encontroDeus] = updates.encontroDeus;
  if (updates.escolaDiscipulos !== undefined)
    raw[MEMBER_COLUMNS.escolaDiscipulos] = updates.escolaDiscipulos;
  if (updates.celula !== undefined) raw[MEMBER_COLUMNS.celula] = updates.celula;
  if (updates.enderecoBairro !== undefined)
    raw[MEMBER_COLUMNS.enderecoBairro] = updates.enderecoBairro;

  await updateRow(SHEETS.membros, row, raw);
  cache.invalidate();
}

export async function createMember(
  input: Partial<Omit<Member, '_row' | 'id'>>,
): Promise<Member> {
  const raw: Record<string, string> = {};
  raw[MEMBER_COLUMNS.dataCadastro] =
    input.dataCadastro || new Date().toLocaleString('pt-BR');
  if (input.nome !== undefined) raw[MEMBER_COLUMNS.nome] = input.nome;
  if (input.telefone !== undefined) raw[MEMBER_COLUMNS.telefone] = input.telefone;
  if (input.dataNascimento !== undefined)
    raw[MEMBER_COLUMNS.dataNascimento] = input.dataNascimento;
  if (input.endereco !== undefined) raw[MEMBER_COLUMNS.endereco] = input.endereco;
  if (input.bairro !== undefined) raw[MEMBER_COLUMNS.bairro] = input.bairro;
  if (input.abrigo !== undefined) raw[MEMBER_COLUMNS.abrigo] = input.abrigo;
  if (input.batismo !== undefined) raw[MEMBER_COLUMNS.batismo] = input.batismo;
  if (input.encontroDeus !== undefined)
    raw[MEMBER_COLUMNS.encontroDeus] = input.encontroDeus;
  if (input.escolaDiscipulos !== undefined)
    raw[MEMBER_COLUMNS.escolaDiscipulos] = input.escolaDiscipulos;
  if (input.celula !== undefined) raw[MEMBER_COLUMNS.celula] = input.celula;
  if (input.enderecoBairro !== undefined)
    raw[MEMBER_COLUMNS.enderecoBairro] = input.enderecoBairro;

  const row = await appendRow(SHEETS.membros, raw);
  cache.invalidate();
  return {
    _row: row,
    id: `m-${row}`,
    dataCadastro: raw[MEMBER_COLUMNS.dataCadastro] ?? '',
    nome: raw[MEMBER_COLUMNS.nome] ?? '',
    telefone: raw[MEMBER_COLUMNS.telefone] ?? '',
    dataNascimento: raw[MEMBER_COLUMNS.dataNascimento] ?? '',
    endereco: raw[MEMBER_COLUMNS.endereco] ?? '',
    bairro: raw[MEMBER_COLUMNS.bairro] ?? '',
    abrigo: raw[MEMBER_COLUMNS.abrigo] ?? '',
    batismo: raw[MEMBER_COLUMNS.batismo] ?? '',
    encontroDeus: raw[MEMBER_COLUMNS.encontroDeus] ?? '',
    escolaDiscipulos: raw[MEMBER_COLUMNS.escolaDiscipulos] ?? '',
    celula: raw[MEMBER_COLUMNS.celula] ?? '',
    enderecoBairro: raw[MEMBER_COLUMNS.enderecoBairro] ?? '',
  };
}

export async function deleteMember(row: number): Promise<void> {
  await deleteRow(SHEETS.membros, row);
  cache.invalidate();
}
