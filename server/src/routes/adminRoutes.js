import { Router } from 'express'
import { createStaff, listAssignableStaff, listDepartments, listUsers, updateUser } from '../controllers/adminController.js'
import { allowRoles, requireAuth } from '../middleware/auth.js'
const router = Router()
router.get('/departments', requireAuth, listDepartments)
router.get('/staff', requireAuth, allowRoles('admin', 'department'), listAssignableStaff)
router.get('/admin/users', requireAuth, allowRoles('admin'), listUsers)
router.post('/admin/users', requireAuth, allowRoles('admin'), createStaff)
router.patch('/admin/users/:id', requireAuth, allowRoles('admin'), updateUser)
export default router
