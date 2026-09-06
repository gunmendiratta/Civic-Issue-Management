import Issue from '../models/Issue.js'
import Notification from '../models/Notification.js'

export async function analytics(_req, res) {
  const [totals, categories, statuses, severities, trend, departments] = await Promise.all([
    Issue.aggregate([{ $group: { _id: null, total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } }, critical: { $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] } }, averagePriority: { $avg: '$priorityScore' } } }]),
    Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Issue.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Issue.aggregate([{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 30 }]),
    Issue.aggregate([{ $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'departmentInfo' } }, { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$departmentInfo.name', 0] }, 'Unassigned'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
  ])
  res.json({ overview: totals[0] || { total: 0, resolved: 0, critical: 0, averagePriority: 0 }, categories, statuses, severities, trend, departments })
}
export async function notifications(req, res) { const items = await Notification.find({ recipient: req.auth.userId }).sort({ createdAt: -1 }).limit(50).populate('issue', 'title status'); res.json(items) }
export async function readNotification(req, res) { const item = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.auth.userId }, { readAt: new Date() }, { new: true }); if (!item) return res.status(404).json({ message: 'Notification not found.' }); res.json(item) }
