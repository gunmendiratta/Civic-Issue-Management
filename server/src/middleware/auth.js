import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Authentication is required.' })
  try { req.auth = jwt.verify(token, process.env.JWT_SECRET); next() } catch { return res.status(401).json({ message: 'Your session is invalid or has expired.' }) }
}

export const allowRoles = (...roles) => (req, res, next) => {
  if (roles.includes(req.auth?.role)) return next()
  return res.status(403).json({ message: 'You are not allowed to perform this action.' })
}
