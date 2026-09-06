import mongoose from 'mongoose'
import { CATEGORIES, SEVERITIES, STATUSES } from '../config/constants.js'

const evidenceSchema = new mongoose.Schema({ url: String, caption: { type: String, maxlength: 240 }, uploadedAt: { type: Date, default: Date.now } }, { _id: false })
const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: undefined },
  address: { type: String, required: true, trim: true, maxlength: 300 },
  ward: { type: String, trim: true, maxlength: 100 },
  landmark: { type: String, trim: true, maxlength: 200 },
}, { _id: false })

const schema = new mongoose.Schema({
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, enum: CATEGORIES, required: true },
  aiResult: { category: String, categoryConfidence: Number, severity: String, severityScore: Number, explanation: String, analyzedAt: Date },
  severity: { type: String, enum: SEVERITIES, default: 'Medium', index: true },
  priorityScore: { type: Number, min: 0, max: 100, default: 45, index: true },
  priorityLabel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  location: { type: locationSchema, required: true },
  images: [evidenceSchema], videoUrl: { type: String, maxlength: 500 },
  status: { type: String, enum: STATUSES, default: 'Reported', index: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  possibleDuplicates: [{ issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }, score: Number, distanceMeters: Number }],
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  resolutionEvidence: [evidenceSchema], resolvedAt: Date, citizenConfirmedAt: Date,
}, { timestamps: true, versionKey: false })
schema.index({ location: '2dsphere' }, { sparse: true })
schema.index({ title: 'text', description: 'text', 'location.address': 'text' })
schema.virtual('reference').get(function reference() { return `CIV-${String(this._id).slice(-6).toUpperCase()}` })
schema.set('toJSON', { virtuals: true })
export default mongoose.model('Issue', schema)
