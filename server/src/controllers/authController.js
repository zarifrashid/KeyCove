import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getDbStatus } from '../config/db.js'

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallbacksecret', { expiresIn: '7d' })
}

function sendTokenResponse(res, user) {
  const token = generateToken(user._id)
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  res.status(200).json({
    message: 'Success',
<<<<<<< HEAD
    token,
=======
>>>>>>> origin/main
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
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

export async function registerUser(req, res) {
  try {
    if (!ensureDbConnection(res)) return

    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    })

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
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

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    sendTokenResponse(res, user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function logoutUser(req, res) {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) })
  res.status(200).json({ message: 'Logged out successfully' })
}

export async function getMe(req, res) {
  try {
    if (!ensureDbConnection(res)) return

    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({ user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
