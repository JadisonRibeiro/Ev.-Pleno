import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { api } from '@/lib/api';
import type { Cell } from '@/types/api';
import { isActiveCell } from '@/lib/analytics';

const markerIcon = L.divIcon({
  className: 'cell-marker',
  html: `<span style="
    display:block;width:14px;height:14px;border-radius:9999px;
    background:#f5f5f5;box-shadow:0 0 0 4px rgba(255,255,255,0.22);
    border:1.5px solid #000;"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function MapPage() {
  const { data: cells = [], isLoading } = useQuery({
    queryKey: ['cells'],
    queryFn: async () => (await api.get<{ cells: Cell[] }>('/cells')).data.cells,
  });

  const points = useMemo(
    () =>
      cells
        .filter(isActiveCell)
        .map((c) => {
          const lat = parseCoord(c.latitude);
          const lng = parseCoord(c.longitude);
          if (lat === null || lng === null) return null;
          return { ...c, lat, lng };
        })
        .filter((x): x is Cell & { lat: number; lng: number } => x !== null),
    [cells],
  );

  const missingCoord = cells.filter(isActiveCell).length - points.length;

  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [-14.235, -51.9253];
    const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return [lat, lng];
  }, [points]);

  return (
    <section className="animate-fade-up">
      <header className="mb-6">
        <p className="kicker">Geografia</p>
        <h1 className="page-title mt-1">Mapa das células</h1>
        <p className="page-subtitle">
          {points.length} célula(s) ativas com coordenadas
          {missingCoord > 0 && ` · ${missingCoord} ativa(s) sem latitude/longitude`}
        </p>
      </header>

      <div className="card overflow-hidden p-0">
        <div className="h-[560px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-text-muted">
              Carregando…
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={points.length === 0 ? 4 : 12}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {points.map((c) => (
                <Marker key={c.nome} position={[c.lat, c.lng]} icon={markerIcon}>
                  <Popup>
                    <strong>{c.nome}</strong>
                    <br />
                    Líder: {c.lider}
                    <br />
                    {[c.endereco, c.bairro, c.cidade].filter(Boolean).join(' · ') || '—'}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </section>
  );
}

/** Aceita "-23.5505" e "-23,5505" (vírgula decimal do Sheets em pt-BR). */
function parseCoord(raw: string): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}
