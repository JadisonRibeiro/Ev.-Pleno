import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayersControl, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import {
  Church,
  Home as HomeIcon,
  List,
  MapPin,
  PowerOff,
  Pencil,
  Plus,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Cell } from '@/types/api';
import { isActiveCell } from '@/lib/analytics';
import { useDebounced } from '@/hooks/useDebounced';
import { apiError } from '@/lib/error';
import { formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  FilterBar,
  FilterSelect,
  SearchInput,
} from '@/components/ui/FilterBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { toast } from '@/components/ui/Toaster';
import { CellEditDialog } from '@/components/CellEditDialog';
import { Avatar } from '@/components/Avatar';
import { cn } from '@/utils/cn';

type Tab = 'lista' | 'mapa';

export default function CellsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('lista');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [cidade, setCidade] = useState('');
  const [tipo, setTipo] = useState('');
  const [editing, setEditing] = useState<Cell | null>(null);
  const [creating, setCreating] = useState(false);
  const debounced = useDebounced(query, 200);

  const { data: cells = [], isLoading } = useQuery({
    queryKey: ['cells'],
    queryFn: async () => (await api.get<{ cells: Cell[] }>('/cells')).data.cells,
  });

  const update = useMutation({
    mutationFn: async ({
      nome,
      patch,
    }: {
      nome: string;
      patch: Partial<Cell>;
    }) => {
      await api.patch(`/cells/${encodeURIComponent(nome)}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cells'] });
      toast.success('Célula atualizada');
      setEditing(null);
    },
    onError: (err) => toast.error('Erro ao salvar', apiError(err)),
  });

  const create = useMutation({
    mutationFn: async (input: Partial<Cell>) => {
      await api.post('/cells', input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cells'] });
      toast.success('Célula criada com sucesso');
      setCreating(false);
    },
    onError: (err) => toast.error('Erro ao criar célula', apiError(err)),
  });

  const cidadeOptions = useMemo(
    () => uniqueOptions(cells.map((c) => c.cidade)),
    [cells],
  );
  const tipoOptions = useMemo(
    () => uniqueOptions(cells.map((c) => c.tipo)),
    [cells],
  );
  const statusOptions = useMemo(
    () => uniqueOptions(cells.map((c) => c.status)),
    [cells],
  );

  // Células com tipo "Geral" (igreja/sítio) NÃO entram em nenhuma contagem
  // regular — apenas no painel de "Locais oficiais" do mapa.
  const regulares = useMemo(
    () => cells.filter((c) => !isSpecialCell(c)),
    [cells],
  );
  const totalContaveis = regulares.length;
  const ativas = useMemo(
    () => regulares.filter((c) => isActiveCell(c)).length,
    [regulares],
  );
  const desabilitadas = useMemo(
    () => regulares.filter((c) => !isActiveCell(c)).length,
    [regulares],
  );

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return cells.filter((c) => {
      if (q) {
        const hay =
          `${c.nome} ${c.lider} ${c.bairro} ${c.cidade} ${c.tipo}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status && c.status !== status) return false;
      if (cidade && c.cidade !== cidade) return false;
      if (tipo && c.tipo !== tipo) return false;
      return true;
    });
  }, [cells, debounced, status, cidade, tipo]);

  const activeFilters = [status, cidade, tipo].filter(Boolean).length;

  const columns: Column<Cell>[] = [
    {
      key: 'lider',
      header: 'Líder',
      sortValue: (c) => c.lider.toLowerCase(),
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar src={c.fotoPerfil} name={c.lider} />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{c.lider || '—'}</p>
            <p className="truncate text-xs text-text-muted">{c.tipo || 'Célula'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'nome',
      header: 'Célula',
      sortValue: (c) => c.nome.toLowerCase(),
      cell: (c) => <p className="font-medium text-text">{c.nome}</p>,
    },
    {
      key: 'local',
      header: 'Local',
      sortValue: (c) => `${c.cidade} ${c.bairro}`.toLowerCase(),
      cell: (c) => (
        <div className="text-text-muted">
          {[c.bairro, c.cidade].filter(Boolean).join(' · ') || '—'}
        </div>
      ),
      hideOn: 'md',
    },
    {
      key: 'status',
      header: 'Situação',
      sortValue: (c) => c.status.toLowerCase(),
      cell: (c) => {
        if (isSpecialCell(c)) {
          return (
            <span
              className="badge whitespace-nowrap"
              style={{
                background: 'rgba(127,29,43,0.10)',
                color: SPECIAL_COLOR,
                borderColor: 'rgba(127,29,43,0.30)',
              }}
            >
              <span className="badge-dot bg-current" />
              Geral
            </span>
          );
        }
        return (
          <span
            className={cn(
              'badge whitespace-nowrap',
              isActiveCell(c) ? 'badge-success' : 'badge-neutral',
            )}
          >
            <span className="badge-dot bg-current" />
            {isActiveCell(c) ? 'Ativa' : 'Desabilitada'}
          </span>
        );
      },
    },
  ];

  return (
    <section className="animate-fade-up">
      <PageHeader
        kicker="Gestão"
        title="Células"
        subtitle={
          <span>
            {formatNumber(totalContaveis)} células no total ·{' '}
            <span style={{ color: 'var(--success)' }}>
              {formatNumber(ativas)} ativas
            </span>
          </span>
        }
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={16} />
            Nova célula
          </button>
        }
      />

      {/* Summary cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <SummaryCard
          icon={HomeIcon}
          label="Células ativas"
          value={ativas}
          tone="success"
        />
        <SummaryCard
          icon={PowerOff}
          label="Células desabilitadas"
          value={desabilitadas}
          tone="muted"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 border-b border-border">
        <TabButton active={tab === 'lista'} onClick={() => setTab('lista')} icon={List}>
          Lista
        </TabButton>
        <TabButton active={tab === 'mapa'} onClick={() => setTab('mapa')} icon={MapPin}>
          Mapa
        </TabButton>
      </div>

      {tab === 'lista' && (
        <>
          <FilterBar>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar por nome, líder, bairro ou cidade…"
            />
            {statusOptions.length > 0 && (
              <FilterSelect
                label="Situação"
                value={status}
                onChange={setStatus}
                options={[{ label: 'Todas', value: '' }, ...statusOptions]}
              />
            )}
            {cidadeOptions.length > 0 && (
              <FilterSelect
                label="Cidade"
                value={cidade}
                onChange={setCidade}
                options={[{ label: 'Todas', value: '' }, ...cidadeOptions]}
              />
            )}
            {tipoOptions.length > 0 && (
              <FilterSelect
                label="Tipo"
                value={tipo}
                onChange={setTipo}
                options={[{ label: 'Todos', value: '' }, ...tipoOptions]}
              />
            )}
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStatus('');
                  setCidade('');
                  setTipo('');
                }}
                className="ml-auto text-xs text-text-muted hover:text-text"
              >
                Limpar ({activeFilters})
              </button>
            )}
          </FilterBar>

          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(c) => c.nome}
            isLoading={isLoading}
            emptyTitle="Nenhuma célula encontrada"
            emptyDescription="Tente ajustar os filtros."
            onRowClick={(c) => setEditing(c)}
            actions={(c) => (
              <IconButton label="Editar" onClick={() => setEditing(c)}>
                <Pencil size={14} />
              </IconButton>
            )}
          />
        </>
      )}

      {tab === 'mapa' && <CellsMap cells={cells} isLoading={isLoading} />}

      <CellEditDialog
        cell={editing}
        creating={creating}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
        onSubmit={(values) => {
          if (editing) {
            update.mutate({ nome: editing.nome, patch: values });
          } else {
            create.mutate(values);
          }
        }}
        submitting={update.isPending || create.isPending}
      />
    </section>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
        active ? 'text-primary' : 'text-text-muted hover:text-text',
      )}
    >
      <Icon size={15} />
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-3 -bottom-px h-[2px] rounded-full"
          style={{ background: 'var(--primary)' }}
        />
      )}
    </button>
  );
}

// ─── Summary cards ───────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof HomeIcon;
  label: string;
  value: number;
  tone: 'success' | 'muted';
}) {
  const palette =
    tone === 'success'
      ? {
          iconBg: 'rgba(22, 197, 94, 0.12)',
          iconColor: '#16a34a',
          accent: 'linear-gradient(90deg, #166534 0%, #22c55e 100%)',
        }
      : {
          iconBg: 'var(--surface-2)',
          iconColor: 'var(--text-muted)',
          accent: 'linear-gradient(90deg, #4b5563 0%, #9ca3af 100%)',
        };
  return (
    <div className="card relative overflow-hidden">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: palette.accent }}
      />
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: palette.iconBg, color: palette.iconColor }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-text">
            {formatNumber(value)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Map tab ─────────────────────────────────────────────────────────────────

/**
 * Paleta usada para colorir cada tipo de célula. Os tipos vêm da própria
 * planilha (coluna "Tipo de Celula") — a legenda é construída dinamicamente
 * a partir dos valores únicos que existem nos dados.
 */
const TYPE_PALETTE = [
  '#7f1d2b', // vinho (igreja)
  '#1d4ed8', // azul
  '#db2777', // rosa
  '#16a34a', // verde
  '#0891b2', // ciano
  '#9333ea', // roxo
  '#ea580c', // laranja
  '#ca8a04', // âmbar
  '#0d9488', // teal
  '#be123c', // rose
  '#4338ca', // indigo
  '#475569', // slate
];
const FALLBACK_COLOR = '#6b7280'; // cinza para células sem tipo informado
const FALLBACK_LABEL = 'Sem tipo';

/** Mapa estável: tipo → cor, baseado nos valores reais que aparecem nos dados. */
function buildTypeColorMap(cells: Cell[]): Map<string, string> {
  const types = new Set<string>();
  for (const c of cells) {
    const t = c.tipo.trim();
    if (t) types.add(t);
  }
  const sorted = [...types].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const map = new Map<string, string>();
  sorted.forEach((t, i) => {
    map.set(t, TYPE_PALETTE[i % TYPE_PALETTE.length] ?? FALLBACK_COLOR);
  });
  return map;
}

function colorForCell(c: Cell, typeColors: Map<string, string>): string {
  const t = c.tipo.trim();
  if (!t) return FALLBACK_COLOR;
  return typeColors.get(t) ?? FALLBACK_COLOR;
}

function makeMarkerIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'cell-marker',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};box-shadow:0 0 0 4px ${color}33,0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const SPECIAL_COLOR = '#7f1d2b';

/**
 * Células com tipo "Geral" representam locais oficiais (igreja, sítio).
 * Independem do status — mesmo se "Ativa" na planilha, entram aqui e ficam
 * fora das contagens regulares de células.
 */
function isSpecialCell(c: Cell): boolean {
  return c.tipo.trim().toLowerCase() === 'geral';
}

/** Ícone especial em destaque (igreja + sítio): círculo grande com símbolo de igreja. */
function makeSpecialMarkerIcon(): L.DivIcon {
  const churchSvg = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff"
         stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M10 9h4"/>
      <path d="M12 7v5"/>
      <path d="M14 22v-4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4"/>
      <path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/>
      <path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"/>
    </svg>
  `;
  return L.divIcon({
    className: 'cell-marker-special',
    html: `
      <div style="
        position:relative;
        width:42px;height:42px;border-radius:9999px;
        background:linear-gradient(135deg,#7f1d2b 0%,#b0304a 100%);
        box-shadow:
          0 0 0 4px #ffffff,
          0 0 0 8px rgba(127,29,43,0.32),
          0 4px 14px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      ">${churchSvg}</div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function parseCoord(raw: string): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

function CellsMap({ cells, isLoading }: { cells: Cell[]; isLoading: boolean }) {
  // Células regulares ativas (excluindo as de tipo "Geral").
  const ativas = useMemo(
    () => cells.filter((c) => isActiveCell(c) && !isSpecialCell(c)),
    [cells],
  );
  const especiais = useMemo(() => cells.filter(isSpecialCell), [cells]);

  // Mapa de cores derivado dos tipos reais que aparecem nas células ativas.
  const typeColors = useMemo(() => buildTypeColorMap(ativas), [ativas]);

  // Filtro por tipo (vazio = todos visíveis). Pontos "Geral" sempre aparecem.
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const allVisible = selectedTypes.size === 0;

  function toggleType(t: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const visibleAtivas = useMemo(() => {
    if (allVisible) return ativas;
    return ativas.filter((c) => {
      const t = c.tipo.trim();
      if (!t) return selectedTypes.has(FALLBACK_LABEL);
      return selectedTypes.has(t);
    });
  }, [ativas, selectedTypes, allVisible]);

  const points = useMemo(() => {
    return visibleAtivas
      .map((c) => {
        const lat = parseCoord(c.latitude);
        const lng = parseCoord(c.longitude);
        if (lat === null || lng === null) return null;
        return { ...c, lat, lng, color: colorForCell(c, typeColors) };
      })
      .filter((x): x is Cell & { lat: number; lng: number; color: string } => x !== null);
  }, [visibleAtivas, typeColors]);

  const specialPoints = useMemo(() => {
    return especiais
      .map((c) => {
        const lat = parseCoord(c.latitude);
        const lng = parseCoord(c.longitude);
        if (lat === null || lng === null) return null;
        return { ...c, lat, lng };
      })
      .filter((x): x is Cell & { lat: number; lng: number } => x !== null);
  }, [especiais]);

  const missingCoord = visibleAtivas.length - points.length;

  const center = useMemo<[number, number]>(() => {
    const all = [
      ...specialPoints.map((p) => [p.lat, p.lng] as [number, number]),
      ...points.map((p) => [p.lat, p.lng] as [number, number]),
    ];
    if (all.length === 0) return [-14.235, -51.9253];
    const lat = all.reduce((s, p) => s + p[0], 0) / all.length;
    const lng = all.reduce((s, p) => s + p[1], 0) / all.length;
    return [lat, lng];
  }, [points, specialPoints]);

  // Tipos para o filtro: ordem alfabética + "Sem tipo" se houver.
  const typeFilterEntries = useMemo(() => {
    const entries: Array<{ label: string; color: string; total: number }> = [];
    for (const [label, color] of typeColors) {
      const total = ativas.filter((c) => c.tipo.trim() === label).length;
      entries.push({ label, color, total });
    }
    const empty = ativas.filter((c) => !c.tipo.trim()).length;
    if (empty > 0) {
      entries.push({ label: FALLBACK_LABEL, color: FALLBACK_COLOR, total: empty });
    }
    return entries;
  }, [typeColors, ativas]);

  // Legenda: tipos + "Geral" se houver pelo menos uma célula especial.
  const legend = useMemo(() => {
    const entries: Array<{ label: string; color: string; special?: boolean }> = [];
    for (const [label, color] of typeColors) {
      entries.push({ label, color });
    }
    if (ativas.some((c) => !c.tipo.trim())) {
      entries.push({ label: FALLBACK_LABEL, color: FALLBACK_COLOR });
    }
    if (especiais.length > 0) {
      entries.push({ label: 'Igreja & Sítio (Geral)', color: SPECIAL_COLOR, special: true });
    }
    return entries;
  }, [typeColors, ativas, especiais]);

  const totalOnMap = points.length + specialPoints.length;

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      {/* Map column */}
      <div className="flex flex-col gap-3">
        {/* Type filter chips */}
        {typeFilterEntries.length > 0 && (
          <div
            className="card flex flex-wrap items-center gap-1.5 px-3 py-2"
            style={{ background: 'var(--surface)' }}
          >
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Filtrar por tipo
            </span>
            <TypeChip
              active={allVisible}
              color={undefined}
              onClick={() => setSelectedTypes(new Set())}
              label={`Todos (${formatNumber(ativas.length)})`}
            />
            {typeFilterEntries.map((t) => (
              <TypeChip
                key={t.label}
                active={selectedTypes.has(t.label)}
                color={t.color}
                onClick={() => toggleType(t.label)}
                label={`${t.label} (${formatNumber(t.total)})`}
              />
            ))}
          </div>
        )}

        {/* Map */}
        <div className="card overflow-hidden p-0">
          <div className="h-[600px] w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-text-muted">
                Carregando…
              </div>
            ) : (
              <MapContainer
                key={`map-${totalOnMap}`}
                center={center}
                zoom={totalOnMap === 0 ? 4 : 12}
                scrollWheelZoom
                className="h-full w-full"
              >
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Padrão">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Ruas">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Satélite">
                    <TileLayer
                      attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Híbrido">
                    <TileLayer
                      attribution='Tiles &copy; Esri'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>

                {/* Pontos comuns (filtráveis por tipo) */}
                {points.map((c) => (
                  <Marker
                    key={`active-${c.nome}`}
                    position={[c.lat, c.lng]}
                    icon={makeMarkerIcon(c.color)}
                  >
                    <Popup>
                      <CellPopup cell={c} accentColor={c.color} />
                    </Popup>
                  </Marker>
                ))}

                {/* Pontos especiais (sempre visíveis, em destaque) */}
                {specialPoints.map((c) => (
                  <Marker
                    key={`special-${c.nome}`}
                    position={[c.lat, c.lng]}
                    icon={makeSpecialMarkerIcon()}
                    zIndexOffset={1000}
                  >
                    <Popup>
                      <CellPopup cell={c} accentColor={SPECIAL_COLOR} special />
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      </div>

      {/* Side panel: destaques + legend + active cells list */}
      <div className="flex flex-col gap-4">
        {/* Destaques (Geral) */}
        {especiais.length > 0 && (
          <div
            className="card overflow-hidden p-0"
            style={{
              borderColor: 'rgba(127,29,43,0.30)',
              boxShadow: '0 0 0 1px rgba(127,29,43,0.10)',
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                background: 'linear-gradient(135deg, rgba(127,29,43,0.08), rgba(176,48,74,0.05))',
                borderBottom: '1px solid rgba(127,29,43,0.18)',
              }}
            >
              <Sparkles size={14} style={{ color: SPECIAL_COLOR }} />
              <h2 className="text-sm font-semibold" style={{ color: SPECIAL_COLOR }}>
                Locais oficiais
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {especiais.map((c) => (
                <li
                  key={c.nome}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{
                      background: 'linear-gradient(135deg,#7f1d2b 0%,#b0304a 100%)',
                    }}
                  >
                    <Church size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{c.nome}</p>
                    <p className="truncate text-xs text-text-muted">
                      {[c.bairro, c.cidade].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  {!c.latitude || !c.longitude ? (
                    <span className="badge badge-warning text-[10px]" title="Sem coordenadas">
                      sem pin
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Legenda */}
        <div className="card">
          <h2 className="text-sm font-semibold text-text">Legenda</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Cores conforme a coluna "Tipo de Celula".
          </p>
          {legend.length === 0 ? (
            <p className="mt-3 text-xs text-text-subtle">
              Nenhum tipo de célula informado nos dados.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-2">
              {legend.map((m) => (
                <li
                  key={m.label}
                  className="flex items-center gap-2 text-xs text-text-muted"
                >
                  {m.special ? (
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                      style={{
                        background: 'linear-gradient(135deg,#7f1d2b 0%,#b0304a 100%)',
                        boxShadow: '0 0 0 2px rgba(127,29,43,0.20)',
                      }}
                    >
                      <Church size={11} />
                    </span>
                  ) : (
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full border-2 border-white"
                      style={{
                        background: m.color,
                        boxShadow: `0 0 0 2px ${m.color}33`,
                      }}
                    />
                  )}
                  <span className="truncate">{m.label}</span>
                </li>
              ))}
            </ul>
          )}
          {missingCoord > 0 && (
            <p className="mt-3 text-[11px] text-text-subtle">
              {formatNumber(missingCoord)} célula(s) ativa(s) visível(eis) sem latitude/longitude.
            </p>
          )}
        </div>

        {/* Lista de células ativas (filtradas pelos tipos selecionados) */}
        <div className="card overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text">
              Células ativas ({formatNumber(visibleAtivas.length)})
            </h2>
            {!allVisible && (
              <p className="mt-0.5 text-[11px] text-text-subtle">
                Filtrado por {selectedTypes.size} tipo(s).
              </p>
            )}
          </div>
          <ul className="max-h-[320px] divide-y divide-border overflow-y-auto">
            {visibleAtivas.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-muted">
                Nenhuma célula nos filtros atuais.
              </li>
            ) : (
              visibleAtivas.map((c) => {
                const color = colorForCell(c, typeColors);
                return (
                  <li
                    key={c.nome}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span
                      className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: color,
                        boxShadow: `0 0 0 2px ${color}33`,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{c.nome}</p>
                      <p className="truncate text-xs text-text-muted">
                        {c.lider || '—'}
                        {c.tipo && ` · ${c.tipo}`}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-subtle">
                        <MapPin size={11} />
                        {[c.bairro, c.cidade].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                    {!c.latitude || !c.longitude ? (
                      <span
                        className="badge badge-warning text-[10px]"
                        title="Célula sem coordenadas"
                      >
                        sem pin
                      </span>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TypeChip({
  active,
  color,
  label,
  onClick,
}: {
  active: boolean;
  color: string | undefined;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all',
        active
          ? 'font-semibold text-white shadow-sm'
          : 'border-border bg-surface-2 text-text hover:border-border-strong',
      )}
      style={
        active
          ? {
              background: color ?? '#111827',
              borderColor: color ?? '#111827',
            }
          : undefined
      }
    >
      {color && (
        <span
          aria-hidden
          className="inline-block h-2 w-2 shrink-0 rounded-full border border-white"
          style={{
            background: color,
            boxShadow: active ? '0 0 0 1.5px rgba(255,255,255,0.6)' : `0 0 0 2px ${color}33`,
          }}
        />
      )}
      {label}
    </button>
  );
}

function CellPopup({
  cell,
  accentColor,
  special,
}: {
  cell: Cell;
  accentColor: string;
  special?: boolean;
}) {
  return (
    <div className="flex gap-3 p-1" style={{ minWidth: 240 }}>
      {special ? (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg,#7f1d2b 0%,#b0304a 100%)' }}
        >
          <Church size={20} />
        </div>
      ) : (
        <Avatar src={cell.fotoPerfil} name={cell.lider} size="md" />
      )}
      <div className="min-w-0">
        <strong className="block text-sm" style={{ color: 'var(--text)' }}>
          {cell.nome}
        </strong>
        {special ? (
          <p
            className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: accentColor }}
          >
            Local oficial · Geral
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              Líder: {cell.lider || '—'}
            </p>
            {cell.tipo && (
              <p
                className="mt-0.5 text-xs font-medium"
                style={{ color: accentColor }}
              >
                {cell.tipo}
              </p>
            )}
          </>
        )}
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {[cell.endereco, cell.bairro, cell.cidade].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
    </div>
  );
}

function uniqueOptions(values: string[]): Array<{ label: string; value: string }> {
  const set = new Set<string>();
  for (const v of values) {
    const t = (v ?? '').trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((v) => ({
    label: v,
    value: v,
  }));
}
