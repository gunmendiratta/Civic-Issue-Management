import mongoose from 'mongoose'
const schema = new mongoose.Schema({ issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true }, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, body: { type: String, required: true, trim: true, maxlength: 2000 }, visibility: { type: String, enum: ['public', 'internal'], default: 'public' } }, { timestamps: true, versionKey: false })
export default mongoose.model('Comment', schema)
