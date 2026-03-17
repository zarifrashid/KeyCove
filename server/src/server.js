import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import connectDB, { getDbStatus } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import propertyRoutes from './routes/propertyRoutes.js'
import seedRoutes from './routes/seedRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
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

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
})
