import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { addComment, assignIssue, confirmResolution, createIssue, getIssue, listIssues, updateStatus } from '../controllers/issueController.js'
import { allowRoles, requireAuth } from '../middleware/auth.js'
const router = Router(); const root = path.dirname(fileURLToPath(import.meta.url)); const upload = multer({ dest: path.join(root, '../../uploads'), limits: { fileSize: 5 * 1024 * 1024, files: 5 }, fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)) })
router.use(requireAuth); router.get('/', listIssues); router.post('/', allowRoles('citizen'), upload.array('images', 5), createIssue); router.get('/:id', getIssue); router.put('/:id/status', allowRoles('admin', 'department', 'worker'), updateStatus); router.put('/:id/assign', allowRoles('admin', 'department'), assignIssue); router.post('/:id/comments', addComment); router.put('/:id/confirm-resolution', allowRoles('citizen'), confirmResolution); export default router
