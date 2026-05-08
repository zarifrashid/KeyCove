import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getDbStatus } from '../config/db.js'
import { sendVerificationEmail } from '../services/email/emailService.js'

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function isEmailVerificationRequired() {
  return String(process.env.EMAIL_VERIFICATION_REQUIRED || 'true').toLowerCase() !== 'false'
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallbacksecret', { expiresIn: '7d' })
}

function buildCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}

function createVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  return {
    rawToken,
    tokenHash,
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS)
  }
}

function hashToken(token = '') {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified !== false,
    role: user.role,
    phone: user.phone || '',
    companyName: user.companyName || '',
    accountStatus: user.accountStatus || 'active',
    isManagerVerified: Boolean(user.isManagerVerified),
    managerVerificationStatus: user.managerVerificationStatus || 'not_submitted',
    adminProfile: user.adminProfile || null,
    applicationProfile: user.applicationProfile || null
  }
}

function sendTokenResponse(res, user) {
  const token = generateToken(user._id)
  res.cookie('token', token, buildCookieOptions())

  res.status(200).json({
    message: 'Success',
    user: serializeUser(user)
  })
}

function ensureDbConnection(res) {
  if (!getDbStatus()) {
    res.status(503).json({
      message: 'Database is not connected. Check server/.env and your MongoDB Atlas connection string.'
    })
    return false
  }
  return true
}

async function createAndSendVerification(user, req) {
  const verification = createVerificationToken()
  user.emailVerified = false
  user.emailVerifiedAt = null
  user.emailVerificationTokenHash = verification.tokenHash
  user.emailVerificationExpires = verification.expiresAt
  await user.save()

  return sendVerificationEmail({
    user,
    token: verification.rawToken,
    req
  })
}

export async function registerUser(req, res) {
  try {
    if (!ensureDbConnection(res)) return

    const { name, email, password, role, phone, companyName } = req.body || {}

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All required fields must be provided.' })
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' })
    }

    if (!['tenant', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid signup role.' })
    }

    const normalizedEmail = normalizeString(email).toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const normalizedPhone = normalizeString(phone)
    const verificationRequired = isEmailVerificationRequired()

    const user = await User.create({
      name: normalizeString(name),
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: !verificationRequired,
      emailVerifiedAt: verificationRequired ? null : new Date(),
      role,
      phone: normalizedPhone,
      companyName: normalizeString(companyName),
      accountStatus: 'active',
      isManagerVerified: false,
      managerVerificationStatus: role === 'manager' ? 'not_submitted' : 'not_submitted',
      applicationProfile: role === 'tenant'
        ? {
            phone: normalizedPhone,
            occupation: '',
            monthlyIncome: null,
            employmentStatus: '',
            employerName: '',
            currentAddress: '',
            additionalInfo: '',
            lastUpdatedAt: normalizedPhone ? new Date() : null
          }
        : undefined
    })

    if (verificationRequired) {
      const emailResult = await createAndSendVerification(user, req)
      const responsePayload = {
        message: emailResult.sent
          ? 'Account created successfully. Please check your email and verify your account before logging in.'
          : 'Account created successfully. Email SMTP is not configured, so check the server console for the development verification link.',
        requiresEmailVerification: true,
        email: user.email
      }

      if (process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEBUG_LINKS === 'true' && emailResult.verificationUrl) {
        responsePayload.devVerificationUrl = emailResult.verificationUrl
      }

      return res.status(201).json(responsePayload)
    }

    res.status(201).json({
      message: 'Account created successfully',
      requiresEmailVerification: false,
      user: serializeUser(user)
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function loginUser(req, res) {
  try {
    if (!ensureDbConnection(res)) return

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: normalizeString(email).toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const accountStatus = user.accountStatus || 'active'
    if (accountStatus === 'suspended') {
      return res.status(403).json({ message: 'Your account is suspended. Please contact admin.' })
    }

    if (accountStatus === 'deleted') {
      return res.status(403).json({ message: 'This account is no longer available.' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (isEmailVerificationRequired() && user.emailVerified === false) {
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox or resend the verification email.',
        requiresEmailVerification: true,
        email: user.email
      })
    }

    sendTokenResponse(res, user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function verifyEmail(req, res) {
  try {
    if (!ensureDbConnection(res)) return

    const token = normalizeString(req.body?.token || req.params?.token)
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' })
    }

    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpires: { $gt: new Date() }
    }).select('+emailVerificationTokenHash +emailVerificationExpires')

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link. Please request a new verification email.' })
    }

    user.emailVerified = true
    user.emailVerifiedAt = new Date()
    user.emailVerificationTokenHash = ''
    user.emailVerificationExpires = null
    await user.save()

    sendTokenResponse(res, user)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to verify email.' })
  }
}

export async function resendVerificationEmail(req, res) {
  try {
    if (!ensureDbConnection(res)) return

    const email = normalizeString(req.body?.email).toLowerCase()
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }

    const user = await User.findOne({ email }).select('+emailVerificationTokenHash +emailVerificationExpires')
    if (!user) {
      return res.status(404).json({ message: 'No account was found for this email.' })
    }

    if (user.emailVerified !== false) {
      return res.status(200).json({ message: 'This email is already verified. You can log in now.' })
    }

    const emailResult = await createAndSendVerification(user, req)
    const responsePayload = {
      message: emailResult.sent
        ? 'Verification email sent. Please check your inbox.'
        : 'SMTP is not configured, so check the server console for the development verification link.'
    }

    if (process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEBUG_LINKS === 'true' && emailResult.verificationUrl) {
      responsePayload.devVerificationUrl = emailResult.verificationUrl
    }

    res.status(200).json(responsePayload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to resend verification email.' })
  }
}

export async function logoutUser(req, res) {
  res.cookie('token', '', {
    ...buildCookieOptions(),
    expires: new Date(0),
    maxAge: 0
  })
  res.status(200).json({ message: 'Logged out successfully' })
}

export async function getMe(req, res) {
  try {
    if (!ensureDbConnection(res)) return

    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({ user: serializeUser(user) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
