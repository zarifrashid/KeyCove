import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import connectDB, { getDbStatus } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import propertyRoutes from './routes/propertyRoutes.js'
import seedRoutes from './routes/seedRoutes.js'
import recommendationRoutes from './routes/recommendationRoutes.js'
import affordabilityRoutes from './routes/affordabilityRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import propertyRequestRoutes from './routes/propertyRequestRoutes.js'
import leaseRoutes from './routes/leaseRoutes.js'
import mortgageRoutes from './routes/mortgageRoutes.js'
import boardRoutes from './routes/boardRoutes.js'
import arSessionRoutes from './routes/arSessionRoutes.js'
import decisionHubRoutes from './routes/decisionHubRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import managerVerificationRoutes from './routes/managerVerificationRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import roommateGroupRoutes from './routes/roommateGroupRoutes.js'
import propertyReportRoutes from './routes/propertyReportRoutes.js'
import recentlyViewedRoutes from './routes/recentlyViewedRoutes.js'
import faqRoutes from './routes/faqRoutes.js'
import { startLeaseNotificationScheduler } from './services/notifications/leaseNotificationScheduler.js'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })
const app = express()
const PORT = process.env.PORT || 5000
const isVercel = process.env.VERCEL === '1'

function getAllowedOrigins() {
  const configuredOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (isVercel) {
    configuredOrigins.push('https://*.vercel.app')
  }

  return configuredOrigins
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true
  return allowedOrigins.some((allowedOrigin) => {
    if (!allowedOrigin.includes('*')) return false
    const pattern = new RegExp(`^${allowedOrigin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*')}$`)
    return pattern.test(origin)
  })
}

app.set('trust proxy', 1)

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins()
    if (isOriginAllowed(origin, allowedOrigins)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
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
app.use('/api/affordability', affordabilityRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/property-requests', propertyRequestRoutes)
app.use('/api/leases', leaseRoutes)
app.use('/api/mortgage', mortgageRoutes)
app.use('/api/boards', boardRoutes)
app.use('/api/ar-session', arSessionRoutes)
app.use('/api/decision-hub', decisionHubRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/manager-verifications', managerVerificationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/roommate-groups', roommateGroupRoutes)
app.use('/api/property-reports', propertyReportRoutes)
app.use('/api/recently-viewed', recentlyViewedRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

let startupPromise = null
async function startApp() {
  if (!startupPromise) {
    startupPromise = connectDB().then(() => {
      if (!isVercel) {
        startLeaseNotificationScheduler()
      }
    })
  }
  return startupPromise
}

startApp().then(() => {
  if (!isVercel) {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  }
})

export default app
