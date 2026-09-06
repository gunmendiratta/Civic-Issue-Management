import mongoose from 'mongoose'
const schema = new mongoose.Schema({ issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true }, status: { type: String, required: true }, previousStatus: String, note: { type: String, trim: true, maxlength: 1000 }, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true, versionKey: false })
export default mongoose.model('StatusHistory', schema)
