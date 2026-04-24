import { google, sheets_v4 } from 'googleapis';
import { config, type SheetRef } from '../config.js';

let client: sheets_v4.Sheets | null = null;

function loadCredentials() {
  if (config.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(config.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON inválido (não é JSON).');
    }
  }
  return undefined;
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (client) return client;
  const credentials = loadCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    keyFile: credentials ? undefined : config.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  client = google.sheets({ version: 'v4', auth });
  return client;
}

/** Envolve o nome da aba com '...' quando tiver espaço ou caractere não-ASCII. */
function quoteTab(tab: string): string {
  if (/^[A-Za-z0-9_]+$/.test(tab)) return tab;
  return `'${tab.replace(/'/g, "''")}'`;
}

/**
 * Lê todas as linhas de uma aba e devolve como objetos usando a primeira linha como header.
 * `_row` é o número da linha na planilha (1-based, já considerando o header).
 */
export async function readSheet<T extends Record<string, string>>(
  ref: SheetRef,
): Promise<Array<T & { _row: number }>> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ref.id,
    range: quoteTab(ref.tab),
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const values = res.data.values ?? [];
  if (values.length === 0) return [];

  const [header, ...rows] = values as [string[], ...string[][]];
  return rows.map((row, idx) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = row[i] != null ? String(row[i]) : '';
    });
    return { ...(obj as T), _row: idx + 2 };
  });
}

export async function getHeader(ref: SheetRef): Promise<string[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ref.id,
    range: `${quoteTab(ref.tab)}!1:1`,
  });
  return (res.data.values?.[0] as string[] | undefined) ?? [];
}

function colLetter(index0: number): string {
  let n = index0 + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Atualiza colunas específicas de uma linha. Só escreve colunas que
 * existem no header da aba — chaves desconhecidas são ignoradas.
 */
export async function updateRow(
  ref: SheetRef,
  row: number,
  updates: Record<string, string | number | boolean | null | undefined>,
): Promise<void> {
  const header = await getHeader(ref);
  const sheets = getSheetsClient();

  const data: sheets_v4.Schema$ValueRange[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    const col = header.indexOf(key);
    if (col === -1) continue;
    const letter = colLetter(col);
    data.push({
      range: `${quoteTab(ref.tab)}!${letter}${row}`,
      values: [[value ?? '']],
    });
  }
  if (data.length === 0) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: ref.id,
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  });
}
