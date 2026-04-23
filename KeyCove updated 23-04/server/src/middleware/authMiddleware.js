import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function protect(req, res, next) {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret')
    const user = await User.findById(decoded.userId).select('_id role name email phone companyName applicationProfile')

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      companyName: user.companyName || '',
      applicationProfile: user.applicationProfile || null
    }

    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    next()
  }
}
