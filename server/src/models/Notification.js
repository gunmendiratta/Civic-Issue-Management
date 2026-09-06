import mongoose from 'mongoose'
const schema = new mongoose.Schema({ recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }, title: { type: String, required: true, maxlength: 120 }, message: { type: String, required: true, maxlength: 500 }, type: { type: String, enum: ['issue', 'assignment', 'comment', 'system'], default: 'issue' }, readAt: { type: Date, default: null } }, { timestamps: true, versionKey: false })
export default mongoose.model('Notification', schema)
