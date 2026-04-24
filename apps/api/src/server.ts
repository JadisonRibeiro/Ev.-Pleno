import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.routes.js';
import cellsRoutes from './routes/cells.routes.js';
import membersRoutes from './routes/members.routes.js';
import publicRoutes from './routes/public.routes.js';
import amorRoutes from './routes/amor.routes.js';
import abrigoRoutes from './routes/abrigo.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: '200kb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Rate limit no login pra mitigar brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/auth/login', authLimiter);
app.use('/auth/change-password', authLimiter);

app.use('/public', publicRoutes);
app.use('/auth', authRoutes);
app.use('/cells', cellsRoutes);
app.use('/members', membersRoutes);
app.use('/amor', amorRoutes);
app.use('/abrigo', abrigoRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api] erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(config.API_PORT, () => {
  console.log(`[api] ouvindo em http://localhost:${config.API_PORT}`);
});
