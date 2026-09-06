export const notFound = (_req, res) => res.status(404).json({ message: 'Route not found.' })
export const errorHandler = (error, _req, res, _next) => {
  console.error(error)
  if (error.name === 'ZodError') return res.status(422).json({ message: 'Please correct the highlighted fields.', errors: error.flatten() })
  if (error.name === 'CastError') return res.status(404).json({ message: 'Resource not found.' })
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that value already exists.' })
  res.status(error.status || 500).json({ message: error.message || 'Something went wrong.' })
}
