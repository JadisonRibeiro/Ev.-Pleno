import { appendRow, readSheet, updateRow } from '../lib/sheets.js';
import { TTLCache } from '../lib/cache.js';
import { SHEETS } from '../config.js';
import { CELL_COLUMNS, type Cell } from '../types/domain.js';

const cache = new TTLCache<Cell[]>(30_000);

type SheetRow = Record<string, string> & { _row: number };

function rowToCell(row: SheetRow): Cell {
  return {
    _row: row._row,
    fotoPerfil: (row[CELL_COLUMNS.fotoPerfil] ?? '').trim(),
    nome: (row[CELL_COLUMNS.nome] ?? '').trim(),
    lider: (row[CELL_COLUMNS.lider] ?? '').trim(),
    cor: (row[CELL_COLUMNS.cor] ?? '').trim(),
    status: (row[CELL_COLUMNS.status] ?? '').trim(),
    cidade: (row[CELL_COLUMNS.cidade] ?? '').trim(),
    bairro: (row[CELL_COLUMNS.bairro] ?? '').trim(),
    endereco: (row[CELL_COLUMNS.endereco] ?? '').trim(),
    latitude: (row[CELL_COLUMNS.latitude] ?? '').trim(),
    longitude: (row[CELL_COLUMNS.longitude] ?? '').trim(),
    tipo: (row[CELL_COLUMNS.tipo] ?? '').trim(),
  };
}

export async function listCells(): Promise<Cell[]> {
  const cached = cache.get('all');
  if (cached) return cached;
  const rows = await readSheet<SheetRow>(SHEETS.celulas);
  const cells = rows.map(rowToCell).filter((c) => c.nome);
  cache.set('all', cells);
  return cells;
}

export function isActive(cell: Cell): boolean {
  return cell.status.trim().toLowerCase() === 'ativa';
}

export async function listActiveCells(): Promise<Cell[]> {
  return (await listCells()).filter(isActive);
}

export async function findCellByName(name: string): Promise<Cell | undefined> {
  const normalized = name.trim().toLowerCase();
  const cells = await listCells();
  return cells.find((c) => c.nome.trim().toLowerCase() === normalized);
}

export async function updateCell(
  row: number,
  updates: Partial<Omit<Cell, '_row'>>,
): Promise<void> {
  const raw: Record<string, string | undefined> = {};
  if (updates.status !== undefined) raw[CELL_COLUMNS.status] = updates.status;
  if (updates.cidade !== undefined) raw[CELL_COLUMNS.cidade] = updates.cidade;
  if (updates.bairro !== undefined) raw[CELL_COLUMNS.bairro] = updates.bairro;
  if (updates.endereco !== undefined) raw[CELL_COLUMNS.endereco] = updates.endereco;
  if (updates.latitude !== undefined) raw[CELL_COLUMNS.latitude] = updates.latitude;
  if (updates.longitude !== undefined) raw[CELL_COLUMNS.longitude] = updates.longitude;
  if (updates.tipo !== undefined) raw[CELL_COLUMNS.tipo] = updates.tipo;
  if (updates.cor !== undefined) raw[CELL_COLUMNS.cor] = updates.cor;
  if (updates.lider !== undefined) raw[CELL_COLUMNS.lider] = updates.lider;
  if (updates.fotoPerfil !== undefined) raw[CELL_COLUMNS.fotoPerfil] = updates.fotoPerfil;

  await updateRow(SHEETS.celulas, row, raw);
  cache.invalidate();
}

export async function createCell(
  input: Partial<Omit<Cell, '_row'>> & { nome: string },
): Promise<Cell> {
  const raw: Record<string, string> = {
    [CELL_COLUMNS.nome]: input.nome,
    [CELL_COLUMNS.lider]: input.lider ?? '',
    [CELL_COLUMNS.status]: input.status ?? 'Ativa',
    [CELL_COLUMNS.cidade]: input.cidade ?? '',
    [CELL_COLUMNS.bairro]: input.bairro ?? '',
    [CELL_COLUMNS.endereco]: input.endereco ?? '',
    [CELL_COLUMNS.latitude]: input.latitude ?? '',
    [CELL_COLUMNS.longitude]: input.longitude ?? '',
    [CELL_COLUMNS.tipo]: input.tipo ?? '',
    [CELL_COLUMNS.cor]: input.cor ?? '',
    [CELL_COLUMNS.fotoPerfil]: input.fotoPerfil ?? '',
  };

  const row = await appendRow(SHEETS.celulas, raw);
  cache.invalidate();
  return {
    _row: row,
    nome: raw[CELL_COLUMNS.nome] ?? '',
    lider: raw[CELL_COLUMNS.lider] ?? '',
    status: raw[CELL_COLUMNS.status] ?? '',
    cidade: raw[CELL_COLUMNS.cidade] ?? '',
    bairro: raw[CELL_COLUMNS.bairro] ?? '',
    endereco: raw[CELL_COLUMNS.endereco] ?? '',
    latitude: raw[CELL_COLUMNS.latitude] ?? '',
    longitude: raw[CELL_COLUMNS.longitude] ?? '',
    tipo: raw[CELL_COLUMNS.tipo] ?? '',
    cor: raw[CELL_COLUMNS.cor] ?? '',
    fotoPerfil: raw[CELL_COLUMNS.fotoPerfil] ?? '',
  };
}
