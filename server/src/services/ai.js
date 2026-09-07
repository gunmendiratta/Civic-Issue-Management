import Issue from '../models/Issue.js'
import { departmentFor, severityWeight } from '../config/constants.js'

const keywords = { Pothole: ['pothole', 'crater'], 'Garbage / Waste': ['garbage', 'waste', 'trash', 'bin'], 'Broken Streetlight': ['streetlight', 'light', 'lamp'], 'Water Leakage': ['leak', 'water pipe'], 'Road Damage': ['road damage', 'cracked road'], 'Drainage Issue': ['drain', 'sewage', 'overflow'], 'Fallen Tree': ['fallen tree', 'tree branch'], 'Traffic Signal Damage': ['traffic signal', 'traffic light'], 'Illegal Dumping': ['illegal dumping'], 'Public Infrastructure Damage': ['footpath', 'sidewalk', 'bench'] }
const distance = (a, b) => { if (!a?.length || !b?.length) return null; const r = 6371000; const [x1, y1] = a.map((v) => v * Math.PI / 180); const [x2, y2] = b.map((v) => v * Math.PI / 180); const d = 2 * Math.asin(Math.sqrt(Math.sin((y2 - y1) / 2) ** 2 + Math.cos(y1) * Math.cos(y2) * Math.sin((x2 - x1) / 2) ** 2)); return Math.round(r * d) }
const weight = (name, fallback) => { const value = Number(process.env[name]); return Number.isFinite(value) && value >= 0 ? value : fallback }
const weights = () => { const values = { severity: weight('PRIORITY_WEIGHT_SEVERITY', 30), locationRisk: weight('PRIORITY_WEIGHT_LOCATION_RISK', 10), community: weight('PRIORITY_WEIGHT_COMMUNITY', 20), persistence: weight('PRIORITY_WEIGHT_PERSISTENCE', 20), confidence: weight('PRIORITY_WEIGHT_CONFIDENCE', 10), recent: weight('PRIORITY_WEIGHT_RECENT', 10) }; const total = Object.values(values).reduce((sum, value) => sum + value, 0) || 100; return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value / total])) }
const priorityLabel = (score) => score >= 85 ? 'Critical' : score >= 65 ? 'High' : score >= 40 ? 'Medium' : 'Low'

function priorityScore({ severity, category, categoryConfidence, nearbyIssues, now = Date.now() }) {
  const nearbyCount = nearbyIssues.length
  const uniqueReporters = new Set(nearbyIssues.map((issue) => String(issue.citizen))).size
  const recentCount = nearbyIssues.filter((issue) => now - new Date(issue.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000).length
  const severityScore = (severityWeight[severity] || severityWeight.Medium) / 90 * 100
  const locationRiskScore = ['Traffic Signal Damage', 'Pothole', 'Road Damage', 'Water Leakage', 'Drainage Issue'].includes(category) ? 85 : 45
  const communityScore = Math.min(100, nearbyCount * 15 + uniqueReporters * 10)
  const persistenceScore = Math.min(100, nearbyCount * 20)
  const recentScore = Math.min(100, recentCount * 20)
  const confidenceScore = Math.max(0, Math.min(100, (categoryConfidence || 0.5) * 100))
  const factorScores = { severity: Math.round(severityScore), locationRisk: locationRiskScore, community: communityScore, persistence: persistenceScore, confidence: Math.round(confidenceScore), recent: recentScore }
  const activeWeights = weights()
  const score = Math.round(Object.entries(factorScores).reduce((total, [key, value]) => total + value * activeWeights[key], 0))
  return { score: Math.min(100, score), factorScores, nearbyComplaintCount: nearbyCount, uniqueReporters, recentComplaintCount: recentCount, radiusMeters: 500 }
}

export async function analyzeIssue({ title, description, category, coordinates, imageFiles = [] }) {
  const text = `${title} ${description}`.toLowerCase()
  const inferred = Object.entries(keywords).find(([, words]) => words.some((word) => text.includes(word)))?.[0] || category
  const criticalWords = ['accident', 'danger', 'hazard', 'flood', 'fire', 'exposed wire', 'collapsed']
  const highWords = ['large', 'deep', 'overflow', 'urgent', 'dark', 'blocking']
  const severity = criticalWords.some((word) => text.includes(word)) ? 'Critical' : highWords.some((word) => text.includes(word)) ? 'High' : category === 'Pothole' || category === 'Water Leakage' ? 'Medium' : 'Low'
  const categoryConfidence = inferred === category ? 0.78 : 0.63
  const candidates = await Issue.find({ category: inferred, status: { $nin: ['Closed', 'Rejected'] } }).sort({ createdAt: -1 }).limit(100).select('title description location citizen createdAt status')
  const nearbyIssues = candidates.filter((issue) => { const meters = distance(coordinates, issue.location?.coordinates); return meters !== null && meters <= 500 })
  const duplicates = candidates.map((issue) => { const nearby = distance(coordinates, issue.location?.coordinates); const shared = text.split(/\W+/).filter((word) => word.length > 4 && `${issue.title} ${issue.description}`.toLowerCase().includes(word)).length; const score = Math.min(99, (nearby !== null && nearby < 100 ? 65 : nearby !== null && nearby < 500 ? 35 : 0) + Math.min(30, shared * 8)); return { issue: issue._id, score, distanceMeters: nearby } }).filter((item) => item.score >= 50).sort((a, b) => b.score - a.score).slice(0, 3)
  const evidence = priorityScore({ severity, category: inferred, categoryConfidence, nearbyIssues })
  const fallback = { aiStatus: 'baseline', modelName: 'local-rules-baseline', modelVersion: 'baseline-v1', category: inferred, categoryConfidence, categoryConsistent: undefined, severity, severityScore: (severityWeight[severity] || 45) / 100, priorityScore: evidence.score, priorityLabel: priorityLabel(evidence.score), departmentName: departmentFor(inferred), possibleDuplicates: duplicates, communityEvidence: evidence, observed: [], inferredRisks: [], explanation: `Transparent priority score from severity, category risk, ${evidence.nearbyComplaintCount} nearby unresolved report(s), ${evidence.uniqueReporters} unique reporter(s), ${evidence.recentComplaintCount} recent report(s), and AI confidence.` }
  if (!process.env.AI_SERVICE_URL) return fallback
  try {
    const image_base64 = imageFiles[0]?.buffer?.toString('base64')
    const response = await fetch(`${process.env.AI_SERVICE_URL}/predict`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(22000), body: JSON.stringify({ title, description, category, latitude: coordinates?.[1], longitude: coordinates?.[0], image_base64, image_mime_type: imageFiles[0]?.mimetype, nearbyComplaintCount: evidence.nearbyComplaintCount, uniqueReporters: evidence.uniqueReporters, recentComplaintCount: evidence.recentComplaintCount, radiusMeters: evidence.radiusMeters }) })
    if (!response.ok) return { ...fallback, aiStatus: 'unavailable', explanation: 'The AI service returned an error; this issue uses the local fallback recommendation.' }
    const remote = await response.json()
    const remoteSeverity = remote.severity?.value || fallback.severity
    const remoteConfidence = remote.category?.confidence ?? fallback.categoryConfidence
    const finalEvidence = priorityScore({ severity: remoteSeverity, category: remote.category?.value || fallback.category, categoryConfidence: remoteConfidence, nearbyIssues })
    return { ...fallback, aiStatus: remote.status || 'baseline', modelName: remote.modelName, modelVersion: remote.modelVersion, category: remote.category?.value || fallback.category, categoryConfidence: remoteConfidence, categoryConsistent: remote.categoryConsistent, severity: remoteSeverity, severityScore: remote.severity?.confidence ?? fallback.severityScore, priorityScore: finalEvidence.score, priorityLabel: priorityLabel(finalEvidence.score), departmentName: remote.department?.value || fallback.departmentName, communityEvidence: finalEvidence, explanation: `${remote.explanation || fallback.explanation} Priority is calculated by the CivicConnect backend from community and risk signals.`, observed: remote.observed || [], inferredRisks: remote.inferredRisks || [] }
  } catch { return { ...fallback, aiStatus: 'unavailable', explanation: 'The AI service was unavailable; this issue uses the local fallback recommendation.' } }
}
