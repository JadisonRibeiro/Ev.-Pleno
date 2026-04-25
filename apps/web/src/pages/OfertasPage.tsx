import { useState } from 'react';
import { Building2, Copy, Check, QrCode, HandCoins } from 'lucide-react';

function WhatsAppIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982 1.005-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.893 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.473-8.413z" />
    </svg>
  );
}

const CNPJ = '44.537.194/0001-34';
const TITULAR = 'Evangelho Pleno';
const BANCO = 'Cooperativa Sicoob - Primavera';
const WHATS_DISPLAY = '+55 91 9384-2964';
const WHATS_LINK_DIGITS = '5591993842964'; // país 55 + DDD 91 + celular 9 9384-2964
const WHATS_MSG = encodeURIComponent(
  'Olá! Estou enviando o comprovante do meu dízimo/oferta para o Evangelho Pleno.',
);
const WHATS_HREF = `https://wa.me/${WHATS_LINK_DIGITS}?text=${WHATS_MSG}`;
const QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=0&qzone=2&format=svg&data=${encodeURIComponent(
  CNPJ,
)}`;

export default function OfertasPage() {
  const [copied, setCopied] = useState(false);

  async function copyCnpj() {
    try {
      await navigator.clipboard.writeText(CNPJ);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard pode falhar em contextos não-seguros */
    }
  }

  return (
    <section className="animate-fade-up space-y-8">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
        style={{
          background:
            'linear-gradient(120deg, #ffffff 0%, #ffffff 45%, rgba(127, 29, 43, 0.06) 100%)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(127, 29, 43, 0.18), transparent 70%)',
          }}
        />
        <p className="kicker">Contribuição</p>
        <h1 className="mt-1 text-3xl font-semibold text-text">Dízimos e Ofertas</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          "Trazei todos os dízimos à casa do tesouro… provai-me nisto, diz o Senhor dos Exércitos."
          <span className="block text-xs text-text-subtle">— Malaquias 3:10</span>
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Dados bancários (col span 2) */}
        <div className="card lg:col-span-2 flex flex-col gap-5">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text">Dados para depósito / PIX</h2>
                <p className="text-xs text-text-muted">
                  Use o CNPJ como chave PIX no aplicativo do seu banco.
                </p>
              </div>
            </div>
          </header>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="label">Titular</dt>
              <dd className="text-sm font-medium text-text">{TITULAR}</dd>
            </div>
            <div>
              <dt className="label">Banco</dt>
              <dd className="text-sm font-medium text-text">{BANCO}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="label">CNPJ (chave PIX)</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                <code
                  className="rounded-lg border px-3 py-2 text-base font-semibold tracking-wide text-text"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
                >
                  {CNPJ}
                </code>
                <button
                  type="button"
                  onClick={copyCnpj}
                  className="btn-secondary text-xs"
                  aria-label="Copiar CNPJ"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </dd>
            </div>
          </dl>

          {/* WhatsApp callout */}
          <div
            className="mt-2 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: 'rgba(37, 211, 102, 0.06)',
              borderColor: 'rgba(37, 211, 102, 0.25)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: '#25D366' }}
              >
                <WhatsAppIcon size={20} color="#ffffff" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Enviar comprovante</p>
                <p className="text-xs text-text-muted">
                  Após sua contribuição, envie o comprovante pelo WhatsApp da tesouraria.
                </p>
              </div>
            </div>
            <a
              href={WHATS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs"
              style={{ background: '#25D366' }}
            >
              <WhatsAppIcon size={14} color="#ffffff" />
              {WHATS_DISPLAY}
            </a>
          </div>
        </div>

        {/* QR Code */}
        <div className="card flex flex-col items-center text-center">
          <header className="mb-4 flex items-center gap-2 self-start">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
            >
              <QrCode size={16} />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-semibold text-text">QR Code</h2>
              <p className="text-[11px] text-text-muted">Escaneie para copiar o CNPJ</p>
            </div>
          </header>

          <div
            className="rounded-xl border p-4"
            style={{ borderColor: 'var(--border)', background: '#fff' }}
          >
            <img
              src={QR_SRC}
              alt={`QR Code com o CNPJ ${CNPJ}`}
              width={240}
              height={240}
              loading="lazy"
              style={{ display: 'block' }}
            />
          </div>

          <p className="mt-4 text-[11px] text-text-subtle">
            Aponte a câmera do celular ou o leitor de QR do app do banco.
          </p>
        </div>
      </div>

      {/* Nota final */}
      <div
        className="flex items-start gap-3 rounded-xl border p-4"
        style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}
      >
        <HandCoins size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
        <p className="text-xs text-text-muted">
          "Cada um contribua segundo propôs no seu coração, não com tristeza ou por necessidade;
          porque Deus ama ao que dá com alegria."{' '}
          <span className="text-text-subtle">— 2 Coríntios 9:7</span>
        </p>
      </div>
    </section>
  );
}
