import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import User from '../models/User.js'

const credentials = z.object({ name: z.string().trim().min(2).max(80).optional(), email: z.string().email(), password: z.string().min(8).max(128) })
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, department: user.department })
const tokenFor = (user) => jwt.sign({ userId: user._id, role: user.role, department: user.department?._id || user.department || null }, process.env.JWT_SECRET, { expiresIn: '7d' })
export async function register(req, res) { const input = credentials.extend({ name: z.string().trim().min(2).max(80) }).parse(req.body); const exists = await User.findOne({ email: input.email.toLowerCase() }); if (exists) return res.status(409).json({ message: 'An account with this email already exists.' }); const user = await User.create({ ...input, email: input.email.toLowerCase(), passwordHash: await bcrypt.hash(input.password, 12), role: 'citizen' }); res.status(201).json({ token: tokenFor(user), user: publicUser(user) }) }
export async function login(req, res) { const input = credentials.pick({ email: true, password: true }).parse(req.body); const user = await User.findOne({ email: input.email.toLowerCase() }).populate('department', 'name'); if (!user || !user.active || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' }); res.json({ token: tokenFor(user), user: publicUser(user) }) }
export async function me(req, res) { const user = await User.findById(req.auth.userId).populate('department', 'name'); if (!user || !user.active) return res.status(401).json({ message: 'Account unavailable.' }); res.json({ user: publicUser(user) }) }
