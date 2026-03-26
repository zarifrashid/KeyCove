import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import connectDB, { getDbStatus } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import propertyRoutes from './routes/propertyRoutes.js'
import seedRoutes from './routes/seedRoutes.js'
import recommendationRoutes from './routes/recommendationRoutes.js'
<<<<<<< HEAD
import bookmarkRoutes from './routes/bookmarkRoutes.js'
=======
>>>>>>> origin/main
import affordabilityRoutes from './routes/affordabilityRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(cookieParser())

app.get('/api/test', (req, res) => {
  res.json({
    message: 'KeyCove backend is running',
    databaseConnected: getDbStatus()
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    databaseConnected: getDbStatus()
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/recommendations', recommendationRoutes)
<<<<<<< HEAD
app.use('/api/bookmarks', bookmarkRoutes)
=======
>>>>>>> origin/main
app.use('/api/affordability', affordabilityRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
})
