import type { Cell, Member } from '@/types/api';

export const YES = (v: string) => (v ?? '').trim().toLowerCase() === 'sim';
export const isActiveCell = (c: Cell) => (c.status ?? '').trim().toLowerCase() === 'ativa';

// ---------- Funil de Discipulado ----------

export interface DiscipleshipStats {
  total: number;
  batismo: number;
  encontro: number;
  escola: number;
  completo: number; // fez as três etapas
}

export function discipleshipStats(members: Member[]): DiscipleshipStats {
  return {
    total: members.length,
    batismo: members.filter((m) => YES(m.batismo)).length,
    encontro: members.filter((m) => YES(m.encontroDeus)).length,
    escola: members.filter((m) => YES(m.escolaDiscipulos)).length,
    completo: members.filter(
      (m) => YES(m.batismo) && YES(m.encontroDeus) && YES(m.escolaDiscipulos),
    ).length,
  };
}

export function pendentes(members: Member[]) {
  return {
    semBatismo: members.filter((m) => !YES(m.batismo)),
    semEncontro: members.filter((m) => !YES(m.encontroDeus)),
    semEscola: members.filter((m) => !YES(m.escolaDiscipulos)),
  };
}

// ---------- Faixa Etária ----------

/** Tenta parsear "22/07/1995", "1995-07-22", etc. Retorna Date ou null. */
export function parseBirthdate(raw: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // ISO: 1995-07-22 ou 1995-07-22T...
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // BR: 22/07/1995
  const br = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    const [, d, m, y] = br;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function calcAge(birth: Date, ref: Date = new Date()): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

export interface AgeBucket {
  label: string;
  min: number;
  max: number; // inclusive
  total: number;
}

export function ageBuckets(members: Member[]): { buckets: AgeBucket[]; semData: number } {
  const buckets: AgeBucket[] = [
    { label: 'Crianças (0-11)', min: 0, max: 11, total: 0 },
    { label: 'Adolescentes (12-17)', min: 12, max: 17, total: 0 },
    { label: 'Jovens (18-29)', min: 18, max: 29, total: 0 },
    { label: 'Adultos (30-59)', min: 30, max: 59, total: 0 },
    { label: 'Idosos (60+)', min: 60, max: 999, total: 0 },
  ];
  let semData = 0;
  for (const m of members) {
    const birth = parseBirthdate(m.dataNascimento);
    if (!birth) {
      semData += 1;
      continue;
    }
    const age = calcAge(birth);
    if (age < 0 || age > 130) {
      semData += 1;
      continue;
    }
    const b = buckets.find((x) => age >= x.min && age <= x.max);
    if (b) b.total += 1;
  }
  return { buckets, semData };
}

// ---------- Crescimento acumulado ----------

/** Série acumulada dos últimos 12 meses usando `dataCadastro` (Carimbo de data/hora). */
export function growthSeries(members: Member[]): Array<{ mes: string; total: number }> {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const series = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      mes: meses[d.getMonth()] ?? '',
      total: 0,
    };
  });

  for (const m of members) {
    const d = parseTimestamp(m.dataCadastro);
    if (!d) continue;
    for (const s of series) {
      if (
        d.getFullYear() < s.year ||
        (d.getFullYear() === s.year && d.getMonth() <= s.month)
      ) {
        s.total += 1;
      }
    }
  }
  return series.map(({ mes, total }) => ({ mes, total }));
}

function parseTimestamp(raw: string): Date | null {
  if (!raw) return null;
  // Google Forms: "22/07/2025 19:30:45"
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
  if (br) {
    const [, d, m, y, hh, mm, ss] = br;
    const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const iso = new Date(raw);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

// ---------- Distribuição por bairro ----------

export function topBairros(members: Member[], limit = 8): Array<{ bairro: string; total: number }> {
  const counts = new Map<string, number>();
  for (const m of members) {
    const b = (m.bairro ?? '').trim();
    if (!b) continue;
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([bairro, total]) => ({ bairro, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// ---------- Células por status (admin) ----------

export function cellsByStatus(cells: Cell[]) {
  const byStatus = new Map<string, number>();
  for (const c of cells) {
    const s = (c.status || 'Sem status').trim() || 'Sem status';
    byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
  }
  return [...byStatus.entries()].map(([status, total]) => ({ status, total }));
}
