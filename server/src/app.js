import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/authRoutes.js'
import issueRoutes from './routes/issueRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import { errorHandler, notFound } from './middleware/errors.js'

const app = express(); const root = path.dirname(fileURLToPath(import.meta.url)); const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); app.use(cors({ origin: origins, credentials: false })); app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })); app.use(express.json({ limit: '1mb' })); app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); app.use('/uploads', express.static(path.join(root, '../uploads')))
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'civicconnect-api' })); app.use('/api/auth', authRoutes); app.use('/api/issues', issueRoutes); app.use('/api', dashboardRoutes); app.use(notFound); app.use(errorHandler)
export default app
