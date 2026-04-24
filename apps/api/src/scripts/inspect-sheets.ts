/**
 * Diagnóstico: lista as abas + cabeçalho (linha 1) das 3 planilhas reais.
 * Uso: npx tsx apps/api/src/scripts/inspect-sheets.ts
 */
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
loadEnv({ path: path.resolve(PROJECT_ROOT, '.env') });

const KEY_FILE = path.resolve(
  PROJECT_ROOT,
  process.env.GOOGLE_APPLICATION_CREDENTIALS ?? './apps/api/credentials.json',
);

const TARGETS = [
  { label: 'USUARIOS', id: '16unATkAmo65RHoG9RrqjeM6ZBEY1mY2coU-Mu1ghDwA' },
  { label: 'MEMBROS', id: '14JuuUVcDXbA5L2nmOE2jsGETkdBTeMsiqwaCsI-uNFQ' },
  { label: 'CELULAS', id: '198RMrIpfe91_xzP9_17fktEM5t2-rWkibhUQ2-wcPy4' },
  { label: 'AMOR', id: '18OSeu8CGBgKGhMSAJoel7rxP8kYsRf7Yc_nWnKacZis' },
  { label: 'ABRIGO', id: '1FoKK4W4CavBJeJK4V_9kLWejfpt6CmCoSK5-u75sw5Q' },
];

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  for (const t of TARGETS) {
    console.log('\n════════════════════════════════');
    console.log(`▶ ${t.label}  (${t.id})`);
    console.log('════════════════════════════════');
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: t.id });
      const tabs = meta.data.sheets?.map((s) => s.properties?.title) ?? [];
      console.log('Abas:', tabs);

      for (const tab of tabs) {
        if (!tab) continue;
        const row = await sheets.spreadsheets.values.get({
          spreadsheetId: t.id,
          range: `'${tab}'!1:1`,
        });
        const header = row.data.values?.[0] ?? [];
        console.log(`\n  [${tab}] (${header.length} colunas)`);
        header.forEach((h, i) => console.log(`    ${i + 1}. ${h}`));
      }
    } catch (err: any) {
      console.error(`  ERRO: ${err?.message ?? err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
