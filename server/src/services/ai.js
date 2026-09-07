import fs from 'node:fs/promises'
import Issue from '../models/Issue.js'
import { departmentFor, severityWeight } from '../config/constants.js'

const keywords = { Pothole: ['pothole', 'crater'], 'Garbage / Waste': ['garbage', 'waste', 'trash', 'bin'], 'Broken Streetlight': ['streetlight', 'light', 'lamp'], 'Water Leakage': ['leak', 'water pipe'], 'Road Damage': ['road damage', 'cracked road'], 'Drainage Issue': ['drain', 'sewage', 'overflow'], 'Fallen Tree': ['fallen tree', 'tree branch'], 'Traffic Signal Damage': ['traffic signal', 'traffic light'], 'Illegal Dumping': ['illegal dumping'], 'Public Infrastructure Damage': ['footpath', 'sidewalk', 'bench'] }
const distance = (a, b) => { if (!a?.length || !b?.length) return null; const r = 6371000; const [x1, y1] = a.map((v) => v * Math.PI / 180); const [x2, y2] = b.map((v) => v * Math.PI / 180); const d = 2 * Math.asin(Math.sqrt(Math.sin((y2-y1)/2) ** 2 + Math.cos(y1) * Math.cos(y2) * Math.sin((x2-x1)/2) ** 2)); return Math.round(r * d) }

export async function analyzeIssue({ title, description, category, coordinates, imageFiles = [] }) {
  const text = `${title} ${description}`.toLowerCase()
  const inferred = Object.entries(keywords).find(([, words]) => words.some((word) => text.includes(word)))?.[0] || category
  const criticalWords = ['accident', 'danger', 'hazard', 'flood', 'fire', 'exposed wire', 'collapsed']
  const highWords = ['large', 'deep', 'overflow', 'urgent', 'dark', 'blocking']
  const severity = criticalWords.some((word) => text.includes(word)) ? 'Critical' : highWords.some((word) => text.includes(word)) ? 'High' : category === 'Pothole' || category === 'Water Leakage' ? 'Medium' : 'Low'
  const candidates = await Issue.find({ category: inferred, status: { $nin: ['Closed', 'Rejected'] } }).sort({ createdAt: -1 }).limit(25).select('title description location')
  const possibleDuplicates = candidates.map((issue) => {
    const nearby = distance(coordinates, issue.location?.coordinates)
    const shared = text.split(/\W+/).filter((word) => word.length > 4 && `${issue.title} ${issue.description}`.toLowerCase().includes(word)).length
    const score = Math.min(99, (nearby !== null && nearby < 100 ? 65 : nearby !== null && nearby < 500 ? 35 : 0) + Math.min(30, shared * 8))
    return { issue: issue._id, score, distanceMeters: nearby }
  }).filter((item) => item.score >= 50).sort((a, b) => b.score - a.score).slice(0, 3)
  const score = Math.min(100, severityWeight[severity] + Math.min(10, possibleDuplicates.length * 5))
  const fallback = { aiStatus: 'baseline', modelName: 'local-rules-baseline', modelVersion: 'baseline-v1', category: inferred, categoryConfidence: inferred === category ? 0.78 : 0.63, severity, severityScore: score / 100, priorityScore: score, priorityLabel: score >= 85 ? 'Critical' : score >= 65 ? 'High' : score >= 40 ? 'Medium' : 'Low', departmentName: departmentFor(inferred), possibleDuplicates, explanation: 'Automated recommendation based on the report text, category, location proximity, and currently open reports.' }
  if (!process.env.AI_SERVICE_URL) return fallback
  try {
    const image_base64 = imageFiles[0] ? (await fs.readFile(imageFiles[0].path)).toString('base64') : undefined
    const response = await fetch(`${process.env.AI_SERVICE_URL}/predict`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(1500), body: JSON.stringify({ title, description, category, latitude: coordinates?.[1], longitude: coordinates?.[0], image_base64 }) })
    if (!response.ok) return { ...fallback, aiStatus: 'unavailable', explanation: 'The AI service returned an error; this issue uses the local fallback recommendation.' }
    const remote = await response.json()
    return { ...fallback, aiStatus: remote.status || 'baseline', modelName: remote.modelName, modelVersion: remote.modelVersion, category: remote.category?.value || fallback.category, categoryConfidence: remote.category?.confidence ?? fallback.categoryConfidence, severity: remote.severity?.value || fallback.severity, severityScore: remote.severity?.confidence ?? fallback.severityScore, priorityScore: remote.priorityScore ?? fallback.priorityScore, priorityLabel: (remote.priorityScore ?? fallback.priorityScore) >= 85 ? 'Critical' : (remote.priorityScore ?? fallback.priorityScore) >= 65 ? 'High' : (remote.priorityScore ?? fallback.priorityScore) >= 40 ? 'Medium' : 'Low', departmentName: remote.department?.value || fallback.departmentName, explanation: remote.explanation || fallback.explanation }
  } catch { return { ...fallback, aiStatus: 'unavailable', explanation: 'The AI service was unavailable; this issue uses the local fallback recommendation.' } }
}
