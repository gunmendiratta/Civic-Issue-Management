import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import Department from '../src/models/Department.js'
import User from '../src/models/User.js'
import { CATEGORIES } from '../src/config/constants.js'
const names = ['Roads & Transport', 'Sanitation', 'Electrical', 'Water Supply', 'Parks & Public Spaces', 'Traffic Management', 'Public Works']
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicconnect')
for (const name of names) await Department.updateOne({ name }, { $setOnInsert: { name, code: name.replace(/[^A-Z]/g, '').slice(0, 6) || name.slice(0, 3).toUpperCase(), categories: CATEGORIES } }, { upsert: true })
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) await User.updateOne({ email: process.env.ADMIN_EMAIL.toLowerCase() }, { $setOnInsert: { name: process.env.ADMIN_NAME || 'CivicConnect Administrator', email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: 'admin' } }, { upsert: true })
console.log('Departments seeded. Set ADMIN_EMAIL and ADMIN_PASSWORD to create the initial administrator.')
await mongoose.disconnect()
