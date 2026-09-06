import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Issue from './models/Issue.js'
import User from './models/User.js'

const app = express()
const PORT = process.env.PORT || 3000
const root = path.dirname(fileURLToPath(import.meta.url))
const jwtSecret = process.env.JWT_SECRET || 'local-development-secret-change-me'
const upload = multer({
  dest: path.join(root, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
})

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(root, '../uploads')))

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role })
const tokenFor = (user) => jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' })

async function register(req, res, next, role) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' })
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' })
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role })
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) })
  } catch (error) { next(error) }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.post('/api/auth/citizen/register', (req, res, next) => register(req, res, next, 'citizen'))
app.post('/api/auth/admin/register', (req, res, next) => register(req, res, next, 'admin'))
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: email?.toLowerCase() })
    if (!user || !password || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' })
    res.json({ token: tokenFor(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

app.get('/api/issues', async (_req, res, next) => {
  try { res.json(await Issue.find().sort({ createdAt: -1 })) } catch (error) { next(error) }
})
app.post('/api/issues', upload.single('image'), async (req, res, next) => {
  try { res.status(201).json(await Issue.create({ ...req.body, imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined })) } catch (error) { next(error) }
})
app.patch('/api/issues/:id', async (req, res, next) => {
  try {
    const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!issue) return res.status(404).json({ message: 'Issue not found' })
    res.json(issue)
  } catch (error) { next(error) }
})

app.use((error, _req, res, _next) => res.status(400).json({ message: error.message || 'Something went wrong' }))

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicconnect')
  .then(() => app.listen(PORT, () => console.log(`CivicConnect API listening on ${PORT}`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1) })
