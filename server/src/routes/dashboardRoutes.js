import { Router } from 'express'
import { analytics, notifications, readNotification } from '../controllers/dashboardController.js'
import { allowRoles, requireAuth } from '../middleware/auth.js'
const router = Router(); router.get('/admin/analytics', requireAuth, allowRoles('admin', 'department'), analytics); router.get('/notifications', requireAuth, notifications); router.put('/notifications/:id/read', requireAuth, readNotification); export default router
