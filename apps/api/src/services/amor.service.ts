import { readSheet, updateRow } from '../lib/sheets.js';
import { TTLCache } from '../lib/cache.js';
import { SHEETS } from '../config.js';
import { AMOR_COLUMNS, type AmorDecision } from '../types/domain.js';

const cache = new TTLCache<AmorDecision[]>(30_000);

type SheetRow = Record<string, string> & { _row: number };

function rowToDecision(row: SheetRow): AmorDecision {
  return {
    _row: row._row,
    id: `amor-${row._row}`,
    dataCadastro: (row[AMOR_COLUMNS.dataCadastro] ?? '').trim(),
    nome: (row[AMOR_COLUMNS.nome] ?? '').trim(),
    telefone: (row[AMOR_COLUMNS.telefone] ?? '').trim(),
    endereco: (row[AMOR_COLUMNS.endereco] ?? '').trim(),
    decisao: (row[AMOR_COLUMNS.decisao] ?? '').trim(),
    decidiuNo: (row[AMOR_COLUMNS.decidiuNo] ?? '').trim(),
    jaEmCelula: (row[AMOR_COLUMNS.jaEmCelula] ?? '').trim(),
    responsavel: (row[AMOR_COLUMNS.responsavel] ?? '').trim(),
    dataNascimento: (row[AMOR_COLUMNS.dataNascimento] ?? '').trim(),
    tipoCelulaInteresse: (row[AMOR_COLUMNS.tipoCelulaInteresse] ?? '').trim(),
    bairro: (row[AMOR_COLUMNS.bairro] ?? '').trim(),
    convidadoPor: (row[AMOR_COLUMNS.convidadoPor] ?? '').trim(),
    idade: (row[AMOR_COLUMNS.idade] ?? '').trim(),
    opcaoCelula: (row[AMOR_COLUMNS.opcaoCelula] ?? '').trim(),
  };
}

function parseAmorId(id: string): number | null {
  const m = id.match(/^amor-(\d+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 2 ? n : null;
}

export async function listDecisions(): Promise<AmorDecision[]> {
  const cached = cache.get('all');
  if (cached) return cached;
  const rows = await readSheet<SheetRow>(SHEETS.amor);
  const items = rows.map(rowToDecision).filter((d) => d.nome);
  cache.set('all', items);
  return items;
}

export async function listDecisionsByCell(cellName: string): Promise<AmorDecision[]> {
  const n = cellName.trim().toLowerCase();
  const all = await listDecisions();
  return all.filter((d) => d.opcaoCelula.trim().toLowerCase() === n);
}

export async function findDecisionById(id: string): Promise<AmorDecision | undefined> {
  const row = parseAmorId(id);
  if (!row) return undefined;
  const all = await listDecisions();
  return all.find((d) => d._row === row);
}

export async function updateDecision(
  row: number,
  updates: Partial<Omit<AmorDecision, '_row' | 'id' | 'dataCadastro'>>,
): Promise<void> {
  const raw: Record<string, string | undefined> = {};
  if (updates.nome !== undefined) raw[AMOR_COLUMNS.nome] = updates.nome;
  if (updates.telefone !== undefined) raw[AMOR_COLUMNS.telefone] = updates.telefone;
  if (updates.endereco !== undefined) raw[AMOR_COLUMNS.endereco] = updates.endereco;
  if (updates.decisao !== undefined) raw[AMOR_COLUMNS.decisao] = updates.decisao;
  if (updates.decidiuNo !== undefined) raw[AMOR_COLUMNS.decidiuNo] = updates.decidiuNo;
  if (updates.jaEmCelula !== undefined) raw[AMOR_COLUMNS.jaEmCelula] = updates.jaEmCelula;
  if (updates.responsavel !== undefined) raw[AMOR_COLUMNS.responsavel] = updates.responsavel;
  if (updates.dataNascimento !== undefined)
    raw[AMOR_COLUMNS.dataNascimento] = updates.dataNascimento;
  if (updates.tipoCelulaInteresse !== undefined)
    raw[AMOR_COLUMNS.tipoCelulaInteresse] = updates.tipoCelulaInteresse;
  if (updates.bairro !== undefined) raw[AMOR_COLUMNS.bairro] = updates.bairro;
  if (updates.convidadoPor !== undefined) raw[AMOR_COLUMNS.convidadoPor] = updates.convidadoPor;
  if (updates.idade !== undefined) raw[AMOR_COLUMNS.idade] = updates.idade;
  if (updates.opcaoCelula !== undefined) raw[AMOR_COLUMNS.opcaoCelula] = updates.opcaoCelula;

  await updateRow(SHEETS.amor, row, raw);
  cache.invalidate();
}
