import mongoose from 'mongoose'
import app from './app.js'
const PORT = process.env.PORT || 3000
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicconnect')
  .then(() => app.listen(PORT, () => console.log(`CivicConnect API listening on ${PORT}`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1) })
