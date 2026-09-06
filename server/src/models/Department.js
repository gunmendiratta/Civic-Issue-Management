import mongoose from 'mongoose'
const schema = new mongoose.Schema({ name: { type: String, required: true, unique: true, trim: true }, code: { type: String, required: true, unique: true, uppercase: true }, description: { type: String, trim: true }, categories: [{ type: String }], active: { type: Boolean, default: true } }, { timestamps: true, versionKey: false })
export default mongoose.model('Department', schema)
