import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'admin'], required: true },
}, { timestamps: true, versionKey: false })

export default mongoose.model('User', schema)
