import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, ChevronDown, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { AuthUser } from '@/types/api';
import { Logo } from '@/components/Logo';

interface PublicCell { nome: string }

const VERSES = [
  { text: 'Tudo posso naquele que me fortalece.', ref: 'Filipenses 4:13' },
  { text: 'O Senhor é o meu pastor, nada me faltará.', ref: 'Salmos 23:1' },
  { text: 'Confie no Senhor de todo o seu coração.', ref: 'Provérbios 3:5' },
  { text: 'Sede fortes e corajosos. Não temais.', ref: 'Josué 1:9' },
  { text: 'Buscai primeiro o Reino de Deus e a sua justiça.', ref: 'Mateus 6:33' },
  { text: 'O amor de Deus está derramado em nossos corações.', ref: 'Romanos 5:5' },
];

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe sua senha'),
  celula: z.string().min(1, 'Selecione uma célula'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setSession } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [verseIdx, setVerseIdx] = useState(0);
  const [cells, setCells] = useState<PublicCell[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [cellOpen, setCellOpen] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });
  const selectedCell = watch('celula');
  // Register celula manually since we use a custom dropdown
  useEffect(() => { register('celula'); }, [register]);

  // Close custom select on outside click
  useEffect(() => {
    if (!cellOpen) return;
    function onDown(e: MouseEvent) {
      if (cellRef.current && !cellRef.current.contains(e.target as Node)) {
        setCellOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [cellOpen]);

  useEffect(() => { if (user) navigate('/', { replace: true }); }, [user, navigate]);

  useEffect(() => {
    const id = setInterval(() => setVerseIdx((i) => (i + 1) % VERSES.length), 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    api.get<{ cells: PublicCell[] }>('/public/cells')
      .then((r) => setCells(r.data.cells))
      .catch(() => {});
  }, []);

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', values);
      setSession(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setApiError(err?.response?.data?.error ?? 'Erro ao autenticar');
    }
  }

  return (
    <>
      <LoginStyles />
      <div className="lp-root">
        <ShekinahBackdrop />

        <div className="lp-center">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lp-card-wrap"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="lp-card" noValidate>
              {/* Logo (replaces "Entrar" title) */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="lp-brand"
              >
                <Logo variant="branca" className="lp-brand-logo" />
              </motion.div>
              <p className="lp-subtitle">Gestão Ministerial</p>

              <div className="lp-fields">
                {/* Email */}
                <div className="lp-field">
                  <label className="lp-label">E-mail</label>
                  <div className="lp-input-wrap">
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      aria-invalid={!!errors.email}
                      {...register('email')}
                      className={`lp-input ${errors.email ? 'lp-input--err' : ''}`}
                    />
                    <Mail size={18} className="lp-icon" aria-hidden />
                  </div>
                  {errors.email && <p className="lp-err">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="lp-field">
                  <label className="lp-label">Senha</label>
                  <div className="lp-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      aria-invalid={!!errors.senha}
                      {...register('senha')}
                      className={`lp-input ${errors.senha ? 'lp-input--err' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="lp-icon-btn"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.senha && <p className="lp-err">{errors.senha.message}</p>}
                </div>

                {/* Cell — custom dropdown */}
                <div className="lp-field" ref={cellRef}>
                  <label className="lp-label">Célula</label>
                  <div className="lp-select-wrap">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={cellOpen}
                      aria-invalid={!!errors.celula}
                      onClick={() => setCellOpen((o) => !o)}
                      className={`lp-select-btn ${errors.celula ? 'lp-select-btn--err' : ''} ${cellOpen ? 'lp-select-btn--open' : ''}`}
                    >
                      <span className={selectedCell ? 'lp-select-value' : 'lp-select-placeholder'}>
                        {selectedCell || 'Selecione sua célula'}
                      </span>
                      <ChevronDown
                        size={18}
                        className="lp-select-chev"
                        style={{ transform: cellOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>

                    <AnimatePresence>
                      {cellOpen && (
                        <motion.ul
                          key="cell-list"
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          role="listbox"
                          className="lp-select-list"
                        >
                          {cells.length === 0 && (
                            <li className="lp-select-empty">Carregando células…</li>
                          )}
                          {cells.map((c) => {
                            const active = selectedCell === c.nome;
                            return (
                              <li
                                key={c.nome}
                                role="option"
                                aria-selected={active}
                                className={`lp-select-item ${active ? 'lp-select-item--active' : ''}`}
                                onClick={() => {
                                  setValue('celula', c.nome, { shouldValidate: true });
                                  trigger('celula');
                                  setCellOpen(false);
                                }}
                              >
                                <span>{c.nome}</span>
                                {active && <Check size={15} />}
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                  {errors.celula && <p className="lp-err">{errors.celula.message}</p>}
                </div>

                <AnimatePresence>
                  {apiError && (
                    <motion.div
                      key="api-err"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="lp-api-err"
                      role="alert"
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{apiError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={isSubmitting} className="lp-btn">
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="lp-spin" /> Entrando…
                    </>
                  ) : (
                    <>Logar <ArrowRight size={17} /></>
                  )}
                </button>

                {/* Verse rotator */}
                <div className="lp-verse-box">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={verseIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="lp-verse-text">"{VERSES[verseIdx]!.text}"</p>
                      <p className="lp-verse-ref">— {VERSES[verseIdx]!.ref}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}

/* ── Styles ── */
function LoginStyles() {
  return (
    <style>{`
      .lp-root {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: #050507;
      }
      .lp-center {
        position: relative;
        z-index: 10;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
      }
      .lp-card-wrap { width: 100%; max-width: 440px; }

      /* Glassmorphic card */
      .lp-card {
        position: relative;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 28px;
        padding: 2.5rem 2.25rem 2rem;
        backdrop-filter: blur(22px) saturate(140%);
        -webkit-backdrop-filter: blur(22px) saturate(140%);
        box-shadow:
          0 30px 80px rgba(0,0,0,0.45),
          inset 0 1px 0 rgba(255,255,255,0.18);
      }
      .lp-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 28px;
        padding: 1px;
        background: linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.18));
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }

      .lp-brand {
        display: flex;
        justify-content: center;
        margin-bottom: 0.5rem;
      }
      .lp-brand-logo {
        height: 64px;
        width: auto;
        filter: drop-shadow(0 4px 18px rgba(255,255,255,0.18));
      }
      .lp-subtitle {
        text-align: center;
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.5);
        margin: 0 0 1.5rem;
      }

      .lp-fields { display: flex; flex-direction: column; gap: 1.25rem; }
      .lp-field { display: flex; flex-direction: column; gap: 0.375rem; }
      .lp-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.01em;
      }

      .lp-input-wrap { position: relative; display: flex; align-items: center; }
      .lp-input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1.5px solid rgba(255,255,255,0.32);
        color: #fff;
        font-size: 0.95rem;
        padding: 0.55rem 2.25rem 0.55rem 0;
        outline: none;
        transition: border-color 0.25s ease;
        font-family: inherit;
        box-shadow: none !important;
      }
      .lp-input::placeholder { color: rgba(255,255,255,0.4); }
      .lp-input:hover { border-bottom-color: rgba(255,255,255,0.55); }
      .lp-input:focus { border-bottom-color: #fff; }
      .lp-input--err { border-bottom-color: #ff8a8a !important; }

      /* Tame Chrome autofill (no white/yellow box on the email field) */
      .lp-input:-webkit-autofill,
      .lp-input:-webkit-autofill:hover,
      .lp-input:-webkit-autofill:focus,
      .lp-input:-webkit-autofill:active {
        -webkit-background-clip: text !important;
        background-clip: text !important;
        -webkit-text-fill-color: #fff !important;
        caret-color: #fff;
        transition: background-color 9999999s ease-in-out 0s;
      }

      .lp-icon {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255,255,255,0.65);
        pointer-events: none;
      }

      /* Eye toggle button (password) */
      .lp-icon-btn {
        position: absolute;
        right: -4px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        color: rgba(255,255,255,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s, background 0.2s;
      }
      .lp-icon-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }
      .lp-icon-btn:focus-visible {
        outline: 2px solid rgba(255,255,255,0.4);
        outline-offset: 2px;
      }

      .lp-err { font-size: 0.75rem; color: #ffb3b3; margin: 0; }

      /* ── Custom Cell Select ── */
      .lp-select-wrap { position: relative; }
      .lp-select-btn {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1.5px solid rgba(255,255,255,0.32);
        color: #fff;
        font-size: 0.95rem;
        padding: 0.55rem 2.25rem 0.55rem 0;
        outline: none;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: border-color 0.25s ease;
      }
      .lp-select-btn:hover { border-bottom-color: rgba(255,255,255,0.55); }
      .lp-select-btn:focus-visible,
      .lp-select-btn--open { border-bottom-color: #fff; }
      .lp-select-btn--err { border-bottom-color: #ff8a8a !important; }
      .lp-select-placeholder { color: rgba(255,255,255,0.4); }
      .lp-select-value { color: #fff; }
      .lp-select-chev {
        color: rgba(255,255,255,0.65);
        transition: transform 0.22s ease;
        flex-shrink: 0;
      }

      .lp-select-list {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        z-index: 50;
        list-style: none;
        margin: 0;
        padding: 0.375rem;
        max-height: 220px;
        overflow-y: auto;
        background: rgba(20, 20, 24, 0.92);
        backdrop-filter: blur(20px) saturate(140%);
        -webkit-backdrop-filter: blur(20px) saturate(140%);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 14px;
        box-shadow: 0 16px 40px rgba(0,0,0,0.5);
        transform-origin: top center;
      }
      .lp-select-list::-webkit-scrollbar { width: 6px; }
      .lp-select-list::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.2);
        border-radius: 6px;
      }
      .lp-select-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.55rem 0.75rem;
        font-size: 0.875rem;
        color: rgba(255,255,255,0.85);
        border-radius: 9px;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        user-select: none;
      }
      .lp-select-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
      .lp-select-item--active {
        background: rgba(255,255,255,0.14);
        color: #fff;
        font-weight: 500;
      }
      .lp-select-empty {
        padding: 0.6rem 0.75rem;
        font-size: 0.8125rem;
        color: rgba(255,255,255,0.5);
        text-align: center;
      }

      .lp-api-err {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        background: rgba(255,80,80,0.1);
        border: 1px solid rgba(255,120,120,0.3);
        border-radius: 12px;
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
        color: #ffd1d1;
      }

      /* White pill button */
      .lp-btn {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        margin-top: 0.5rem;
        border-radius: 999px;
        font-size: 0.95rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        color: #1a1428;
        background: #fff;
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35), inset 0 -2px 0 rgba(0,0,0,0.05);
        transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }
      .lp-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 16px 40px rgba(255,255,255,0.18), 0 8px 24px rgba(0,0,0,0.4);
        background: #fff8f0;
      }
      .lp-btn:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
      }
      .lp-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      .lp-spin { animation: lpspin 0.8s linear infinite; }

      .lp-verse-box {
        text-align: center;
        margin-top: 0.75rem;
        min-height: 56px;
      }
      .lp-verse-text {
        font-size: 0.8125rem;
        font-style: italic;
        color: rgba(255,255,255,0.78);
        margin: 0 0 0.25rem;
        line-height: 1.55;
      }
      .lp-verse-ref {
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.45);
        margin: 0;
      }

      /* Animations */
      @keyframes lpspin { to { transform: rotate(360deg); } }
      @keyframes twinkle {
        0%, 100% { opacity: 0.18; transform: scale(0.8); }
        50%      { opacity: 0.95; transform: scale(1.2); }
      }
      @keyframes cloudDrift {
        0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        50%      { transform: translate(-50%, -52%) scale(1.04) rotate(2deg); }
      }
      @keyframes cloudCounter {
        0%, 100% { transform: translate(-50%, -50%) scale(1.08) rotate(0deg); }
        50%      { transform: translate(-50%, -48%) scale(1) rotate(-3deg); }
      }
      @keyframes glow {
        0%, 100% { opacity: 0.35; }
        50%      { opacity: 0.6; }
      }
      @keyframes pillarPulse {
        0%, 100% { opacity: 0.18; transform: translateX(-50%) scaleY(1); }
        50%      { opacity: 0.32; transform: translateX(-50%) scaleY(1.08); }
      }
      @keyframes ember {
        0%   { transform: translateY(0) translateX(0); opacity: 0; }
        10%  { opacity: 0.7; }
        90%  { opacity: 0.7; }
        100% { transform: translateY(-120vh) translateX(20px); opacity: 0; }
      }

      /* Responsive */
      @media (max-width: 480px) {
        .lp-card { padding: 2rem 1.5rem 1.5rem; border-radius: 24px; }
        .lp-title { font-size: 1.875rem; }
      }
    `}</style>
  );
}

/* ── Shekinah cloud backdrop (a coluna de nuvem do Tabernáculo) ── */
function ShekinahBackdrop() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.4,
        delay: Math.random() * 8,
        duration: 2.5 + Math.random() * 5,
      })),
    [],
  );

  // Light particles (embers) drifting upward — like glowing dust around the cloud
  const embers = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: 35 + Math.random() * 30,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 18,
        duration: 12 + Math.random() * 14,
      })),
    [],
  );

  return (
    <>
      {/* Subtle base gradient — pure dark with central lift */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, transparent 70%), linear-gradient(180deg, #050507 0%, #0a0a0d 50%, #050507 100%)',
        }}
      />

      {/* Pillar of light — descends from the cloud (Êxodo 13:21) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '8%', bottom: 0, left: '50%',
          width: '420px',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.16) 18%, rgba(220,220,230,0.10) 55%, rgba(255,255,255,0.04) 90%, transparent 100%)',
          filter: 'blur(34px)',
          animation: 'pillarPulse 5.5s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '12%', bottom: 0, left: '50%',
          width: '120px',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.08) 70%, transparent 100%)',
          filter: 'blur(14px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Glory cloud — SVG with feTurbulence for organic shape */}
      <svg
        aria-hidden
        viewBox="0 0 800 800"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '120vmin', height: '120vmin',
          maxWidth: '1100px', maxHeight: '1100px',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      >
        <defs>
          {/* Turbulence-based displacement → organic cloud blob */}
          <filter id="cloudFx" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009"
              numOctaves="3"
              seed="7"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="32s"
                values="0.009;0.014;0.009"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="120" />
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="cloudFx2" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.013"
              numOctaves="2"
              seed="3"
              result="n2"
            >
              <animate
                attributeName="baseFrequency"
                dur="40s"
                values="0.013;0.008;0.013"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n2" scale="80" />
            <feGaussianBlur stdDeviation="22" />
          </filter>

          {/* Inner glow (white core) */}
          <radialGradient id="coreGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#f5f5f8" stopOpacity="0.45" />
            <stop offset="80%" stopColor="#bcbcc4" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="midCloud" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#dcdcdf" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#7a7a83" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer diffuse cloud (slow rotation) */}
        <g style={{ transformOrigin: '400px 400px', animation: 'cloudCounter 28s ease-in-out infinite' }}>
          <circle cx="400" cy="400" r="320" fill="url(#midCloud)" filter="url(#cloudFx2)" />
        </g>

        {/* Mid layer */}
        <g style={{ transformOrigin: '400px 400px', animation: 'cloudDrift 22s ease-in-out infinite' }}>
          <circle cx="400" cy="400" r="240" fill="url(#midCloud)" filter="url(#cloudFx)" />
        </g>

        {/* Bright core */}
        <g style={{ transformOrigin: '400px 400px', animation: 'cloudDrift 18s ease-in-out infinite reverse' }}>
          <circle cx="400" cy="400" r="170" fill="url(#coreGlow)" filter="url(#cloudFx)" />
        </g>

        {/* Inner bright spot — the glory itself */}
        <circle cx="400" cy="400" r="55" fill="rgba(255,255,255,0.9)" filter="url(#cloudFx)" style={{ animation: 'glow 4s ease-in-out infinite' }} />
      </svg>

      {/* Stars */}
      {stars.map((s) => (
        <span
          key={s.id}
          aria-hidden
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            background: '#fff',
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(255,255,255,0.65)',
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Glowing dust particles rising along the pillar */}
      {embers.map((e) => (
        <span
          key={e.id}
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 0 6px rgba(255,255,255,0.6)',
            pointerEvents: 'none',
            animation: `ember ${e.duration}s linear ${e.delay}s infinite`,
          }}
        />
      ))}

      {/* Vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.85) 100%)',
        }}
      />
    </>
  );
}
