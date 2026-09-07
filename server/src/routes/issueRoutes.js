import { Router } from 'express'
import multer from 'multer'
import { addComment, assignIssue, confirmResolution, createIssue, getIssue, listIssues, updateIssueReview, updateStatus } from '../controllers/issueController.js'
import { allowRoles, requireAuth } from '../middleware/auth.js'
const router = Router(); const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE_MB || 5) * 1024 * 1024, files: 5 }, fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)) })
router.use(requireAuth); router.get('/', listIssues); router.post('/', allowRoles('citizen'), upload.array('images', 5), createIssue); router.get('/:id', getIssue); router.put('/:id/status', allowRoles('admin', 'department', 'worker'), updateStatus); router.put('/:id/assign', allowRoles('admin', 'department'), assignIssue); router.put('/:id/ai-review', allowRoles('admin', 'department'), updateIssueReview); router.post('/:id/comments', addComment); router.put('/:id/confirm-resolution', allowRoles('citizen'), confirmResolution); export default router
