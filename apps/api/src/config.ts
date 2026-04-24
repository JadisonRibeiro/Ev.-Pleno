import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

loadEnv({ path: path.resolve(__dirname, '../.env') });
loadEnv({ path: path.resolve(PROJECT_ROOT, '.env') });

const schema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 chars'),

  SHEETS_USUARIOS_ID: z.string().min(10),
  SHEETS_USUARIOS_TAB: z.string().default('Usuarios'),
  SHEETS_CELULAS_ID: z.string().min(10),
  SHEETS_CELULAS_TAB: z.string().default('DADOS'),
  SHEETS_MEMBROS_ID: z.string().min(10),
  SHEETS_MEMBROS_TAB: z.string().default('Respostas ao formulário 1'),
  SHEETS_AMOR_ID: z.string().min(10),
  SHEETS_AMOR_TAB: z.string().default('Respostas ao formulário 1'),
  SHEETS_ABRIGO_ID: z.string().min(10),
  SHEETS_ABRIGO_TAB: z.string().default('Abrigo_Total'),

  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z
    .string()
    .optional()
    .transform((v) => (v ? path.resolve(PROJECT_ROOT, v) : undefined)),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('[config] variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (!parsed.data.GOOGLE_SERVICE_ACCOUNT_JSON && !parsed.data.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    '[config] precisa definir GOOGLE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS no .env',
  );
  process.exit(1);
}
if (
  parsed.data.GOOGLE_APPLICATION_CREDENTIALS &&
  !fs.existsSync(parsed.data.GOOGLE_APPLICATION_CREDENTIALS)
) {
  console.error(
    `[config] arquivo de credenciais não encontrado em ${parsed.data.GOOGLE_APPLICATION_CREDENTIALS}`,
  );
  process.exit(1);
}

export const config = parsed.data;
export { PROJECT_ROOT };

/** Handle tipado pra cada aba — usado pelos services. */
export interface SheetRef {
  id: string;
  tab: string;
}

export const SHEETS: Record<
  'usuarios' | 'celulas' | 'membros' | 'amor' | 'abrigo',
  SheetRef
> = {
  usuarios: { id: config.SHEETS_USUARIOS_ID, tab: config.SHEETS_USUARIOS_TAB },
  celulas: { id: config.SHEETS_CELULAS_ID, tab: config.SHEETS_CELULAS_TAB },
  membros: { id: config.SHEETS_MEMBROS_ID, tab: config.SHEETS_MEMBROS_TAB },
  amor: { id: config.SHEETS_AMOR_ID, tab: config.SHEETS_AMOR_TAB },
  abrigo: { id: config.SHEETS_ABRIGO_ID, tab: config.SHEETS_ABRIGO_TAB },
};
