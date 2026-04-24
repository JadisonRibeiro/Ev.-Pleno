import { readSheet, updateRow } from '../lib/sheets.js';
import { TTLCache } from '../lib/cache.js';
import { SHEETS } from '../config.js';
import { ABRIGO_COLUMNS, ABRIGO_TOTAL_LICOES, type AbrigoAluno } from '../types/domain.js';

const cache = new TTLCache<AbrigoAluno[]>(30_000);

type SheetRow = Record<string, string> & { _row: number };

function toNumber(raw: string): number {
  const n = Number(String(raw ?? '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
}

function rowToAluno(row: SheetRow): AbrigoAluno {
  const total = toNumber(row[ABRIGO_COLUMNS.totalLicoes] ?? '');
  return {
    _row: row._row,
    id: `abrigo-${row._row}`,
    nome: (row[ABRIGO_COLUMNS.nome] ?? '').trim(),
    celula: (row[ABRIGO_COLUMNS.celula] ?? '').trim(),
    totalLicoes: total,
    aulasFeitas: (row[ABRIGO_COLUMNS.aulasFeitas] ?? '').trim(),
    licoesFaltando: toNumber(row[ABRIGO_COLUMNS.licoesFaltando] ?? ''),
    aulasFaltando: (row[ABRIGO_COLUMNS.aulasFaltando] ?? '').trim(),
    statusConclusao: (row[ABRIGO_COLUMNS.statusConclusao] ?? '').trim(),
    progresso: (row[ABRIGO_COLUMNS.progresso] ?? '').trim(),
    concluido: total >= ABRIGO_TOTAL_LICOES,
  };
}

function parseAlunoId(id: string): number | null {
  const m = id.match(/^abrigo-(\d+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 2 ? n : null;
}

export async function listAlunos(): Promise<AbrigoAluno[]> {
  const cached = cache.get('all');
  if (cached) return cached;
  const rows = await readSheet<SheetRow>(SHEETS.abrigo);
  const items = rows.map(rowToAluno).filter((a) => a.nome);
  cache.set('all', items);
  return items;
}

export async function listAlunosByCell(cellName: string): Promise<AbrigoAluno[]> {
  const n = cellName.trim().toLowerCase();
  const all = await listAlunos();
  return all.filter((a) => a.celula.trim().toLowerCase() === n);
}

export async function findAlunoById(id: string): Promise<AbrigoAluno | undefined> {
  const row = parseAlunoId(id);
  if (!row) return undefined;
  const all = await listAlunos();
  return all.find((a) => a._row === row);
}

/**
 * Atualiza contagem/status do aluno na aba `Abrigo_Total`.
 * Atenção: se essas colunas tiverem fórmulas na planilha,
 * a gravação vai substituí-las por valores estáticos.
 */
export async function updateAluno(
  row: number,
  updates: Partial<
    Pick<
      AbrigoAluno,
      'totalLicoes' | 'aulasFeitas' | 'licoesFaltando' | 'aulasFaltando' | 'statusConclusao' | 'progresso'
    >
  >,
): Promise<void> {
  const raw: Record<string, string | number | undefined> = {};
  if (updates.totalLicoes !== undefined) raw[ABRIGO_COLUMNS.totalLicoes] = updates.totalLicoes;
  if (updates.aulasFeitas !== undefined) raw[ABRIGO_COLUMNS.aulasFeitas] = updates.aulasFeitas;
  if (updates.licoesFaltando !== undefined)
    raw[ABRIGO_COLUMNS.licoesFaltando] = updates.licoesFaltando;
  if (updates.aulasFaltando !== undefined)
    raw[ABRIGO_COLUMNS.aulasFaltando] = updates.aulasFaltando;
  if (updates.statusConclusao !== undefined)
    raw[ABRIGO_COLUMNS.statusConclusao] = updates.statusConclusao;
  if (updates.progresso !== undefined) raw[ABRIGO_COLUMNS.progresso] = updates.progresso;

  await updateRow(SHEETS.abrigo, row, raw);
  cache.invalidate();
}
