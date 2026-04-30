import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Property from '../models/Property.js'
import PropertyRequest from '../models/PropertyRequest.js'
import Lease from '../models/Lease.js'
import Conversation from '../models/Conversation.js'
import Favorite from '../models/Favorite.js'
import ManagerVerification from '../models/ManagerVerification.js'
import RoleAssignment from '../models/RoleAssignment.js'
import Announcement from '../models/Announcement.js'
import {
  createBulkNotificationsForUsers,
  createNotification,
  getAdminIds,
  getUserIdsByRole
} from '../services/notifications/notificationService.js'

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase()
}

function escapeRegex(value) {
  return normalizeString(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sanitizeUser(user) {
  if (!user) return null
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    companyName: user.companyName || '',
    accountStatus: user.accountStatus || 'active',
    isManagerVerified: Boolean(user.isManagerVerified),
    managerVerificationStatus: user.managerVerificationStatus || 'not_submitted',
    adminProfile: user.adminProfile || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    suspendedAt: user.suspendedAt || null,
    suspensionReason: user.suspensionReason || ''
  }
}

export async function getAdminOverview(req, res) {
  try {
    const [
      totalUsers,
      totalTenants,
      totalManagers,
      totalAdmins,
      suspendedUsers,
      verifiedManagers,
      pendingVerifications,
      rejectedVerifications,
      activeListings,
      draftListings,
      inactiveListings,
      pendingRequests,
      approvedRequests,
      activeLeases,
      conversations,
      savedProperties
    ] = await Promise.all([
      User.countDocuments({ accountStatus: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'tenant', accountStatus: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'manager', accountStatus: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'admin', accountStatus: { $ne: 'deleted' } }),
      User.countDocuments({ accountStatus: 'suspended' }),
      User.countDocuments({ role: 'manager', isManagerVerified: true, accountStatus: { $ne: 'deleted' } }),
      ManagerVerification.countDocuments({ status: 'pending' }),
      ManagerVerification.countDocuments({ status: 'rejected' }),
      Property.countDocuments({ status: 'active' }),
      Property.countDocuments({ status: 'draft' }),
      Property.countDocuments({ status: 'inactive' }),
      PropertyRequest.countDocuments({ status: 'pending' }),
      PropertyRequest.countDocuments({ status: 'approved' }),
      Lease.countDocuments({ status: 'active' }),
      Conversation.countDocuments({ isActive: true }),
      Favorite.countDocuments()
    ])

    res.status(200).json({
      success: true,
      overview: {
        totalUsers,
        totalTenants,
        totalManagers,
        totalAdmins,
        suspendedUsers,
        verifiedManagers,
        pendingVerifications,
        rejectedVerifications,
        activeListings,
        draftListings,
        inactiveListings,
        pendingRequests,
        approvedRequests,
        activeLeases,
        conversations,
        savedProperties
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load admin overview.' })
  }
}

export async function listUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)))
    const search = normalizeString(req.query.search)
    const role = normalizeString(req.query.role)
    const status = normalizeString(req.query.status)
    const verificationStatus = normalizeString(req.query.verificationStatus)

    const filter = {}

    if (role && ['tenant', 'manager', 'admin'].includes(role)) {
      filter.role = role
    }

    if (status && ['active', 'suspended', 'deleted'].includes(status)) {
      filter.accountStatus = status
    } else {
      filter.accountStatus = { $ne: 'deleted' }
    }

    if (verificationStatus && ['not_submitted', 'pending', 'verified', 'rejected'].includes(verificationStatus)) {
      filter.managerVerificationStatus = verificationStatus
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i')
      filter.$or = [{ name: regex }, { email: regex }, { companyName: regex }, { phone: regex }]
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ])

    res.status(200).json({
      success: true,
      users: users.map(sanitizeUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load users.' })
  }
}

export async function createAdminUser(req, res) {
  try {
    const { name, email, password, phone, department, accessLevel } = req.body || {}

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' })
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' })
    }

    const normalizedEmail = normalizeEmail(email)
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const admin = await User.create({
      name: normalizeString(name),
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizeString(phone),
      role: 'admin',
      accountStatus: 'active',
      adminProfile: {
        department: normalizeString(department, 'Operations') || 'Operations',
        accessLevel: Number(accessLevel) || 1
      }
    })

    await createNotification({
      userId: admin._id,
      actorId: req.user.userId,
      title: 'Admin account created',
      body: 'Your KeyCove admin account has been created.',
      type: 'system',
      relatedEntityType: 'user',
      relatedEntityId: admin._id,
      actionUrl: '/admin',
      priority: 'high',
      skipActor: false
    })

    const otherAdminIds = (await getAdminIds({ exceptUserId: req.user.userId }))
      .filter((adminId) => adminId !== admin._id.toString())
    await createBulkNotificationsForUsers(otherAdminIds, {
      actorId: req.user.userId,
      title: 'New admin account created',
      body: `${admin.name} was added as a KeyCove admin.`,
      type: 'system',
      relatedEntityType: 'user',
      relatedEntityId: admin._id,
      actionUrl: '/admin',
      priority: 'normal'
    })

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      admin: sanitizeUser(admin)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create admin account.' })
  }
}

export async function suspendUser(req, res) {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot suspend your own account.' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        accountStatus: 'suspended',
        suspendedAt: new Date(),
        suspendedBy: req.user.userId,
        suspensionReason: normalizeString(req.body?.reason)
      },
      { new: true }
    ).select('-password')

    if (!user) return res.status(404).json({ message: 'User not found.' })

    await createNotification({
      userId: user._id,
      actorId: req.user.userId,
      title: 'Account suspended',
      body: normalizeString(req.body?.reason)
        ? `Your KeyCove account was suspended. Reason: ${normalizeString(req.body?.reason)}`
        : 'Your KeyCove account was suspended by an admin.',
      type: 'system',
      relatedEntityType: 'user',
      relatedEntityId: user._id,
      actionUrl: '/login',
      priority: 'high',
      skipActor: false
    })

    res.status(200).json({ success: true, message: 'User suspended.', user: sanitizeUser(user) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to suspend user.' })
  }
}

export async function restoreUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        accountStatus: 'active',
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: '',
        deletedAt: null,
        deletedBy: null
      },
      { new: true }
    ).select('-password')

    if (!user) return res.status(404).json({ message: 'User not found.' })

    await createNotification({
      userId: user._id,
      actorId: req.user.userId,
      title: 'Account restored',
      body: 'Your KeyCove account was restored by an admin.',
      type: 'system',
      relatedEntityType: 'user',
      relatedEntityId: user._id,
      actionUrl: '/dashboard',
      priority: 'high',
      skipActor: false
    })

    res.status(200).json({ success: true, message: 'User restored.', user: sanitizeUser(user) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to restore user.' })
  }
}

export async function softDeleteUser(req, res) {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account.' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        accountStatus: 'deleted',
        deletedAt: new Date(),
        deletedBy: req.user.userId
      },
      { new: true }
    ).select('-password')

    if (!user) return res.status(404).json({ message: 'User not found.' })

    await createNotification({
      userId: user._id,
      actorId: req.user.userId,
      title: 'Account removed',
      body: 'Your KeyCove account was removed by an admin.',
      type: 'system',
      relatedEntityType: 'user',
      relatedEntityId: user._id,
      actionUrl: '/login',
      priority: 'high',
      skipActor: false
    })

    res.status(200).json({ success: true, message: 'User soft-deleted.', user: sanitizeUser(user) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete user.' })
  }
}

export async function changeUserRole(req, res) {
  try {
    const nextRole = normalizeString(req.body?.role)
    const reason = normalizeString(req.body?.reason)

    if (!['tenant', 'manager', 'admin'].includes(nextRole)) {
      return res.status(400).json({ message: 'Invalid role.' })
    }

    const user = await User.findById(req.params.id)
    if (!user || user.accountStatus === 'deleted') {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (user._id.toString() === req.user.userId && nextRole !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role.' })
    }

    const previousRole = user.role

    if (previousRole === nextRole) {
      return res.status(200).json({ success: true, message: 'Role is already up to date.', user: sanitizeUser(user) })
    }

    user.role = nextRole
    if (nextRole !== 'manager') {
      user.isManagerVerified = false
      user.managerVerificationStatus = 'not_submitted'
    } else if (!user.managerVerificationStatus) {
      user.managerVerificationStatus = 'not_submitted'
    }

    await user.save()

    await RoleAssignment.create({
      user: user._id,
      previousRole,
      newRole: nextRole,
      assignedBy: req.user.userId,
      reason
    })

    await createNotification({
      userId: user._id,
      actorId: req.user.userId,
      title: 'Role updated',
      body: `Your KeyCove role was changed from ${previousRole} to ${nextRole}.`,
      type: 'system',
      relatedEntityType: 'user',
      relatedEntityId: user._id,
      actionUrl: '/dashboard',
      priority: 'high',
      skipActor: false
    })

    res.status(200).json({ success: true, message: 'User role updated.', user: sanitizeUser(user) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to change role.' })
  }
}

export async function listRoleAssignments(req, res) {
  try {
    const assignments = await RoleAssignment.find({})
      .populate('user', 'name email role')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.status(200).json({ success: true, assignments })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load role history.' })
  }
}

export async function listManagerVerifications(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)))
    const status = normalizeString(req.query.status)
    const filter = {}

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      filter.status = status
    }

    const [total, verifications] = await Promise.all([
      ManagerVerification.countDocuments(filter),
      ManagerVerification.find(filter)
        .populate('manager', 'name email role phone companyName isManagerVerified managerVerificationStatus accountStatus')
        .populate('reviewedByAdmin', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ])

    res.status(200).json({
      success: true,
      verifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load manager verifications.' })
  }
}

export async function reviewManagerVerification(req, res) {
  try {
    const status = normalizeString(req.body?.status)
    const adminNote = normalizeString(req.body?.adminNote)

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected.' })
    }

    const verification = await ManagerVerification.findById(req.params.id)
    if (!verification) {
      return res.status(404).json({ message: 'Verification request not found.' })
    }

    if (verification.status === status) {
      const populatedVerification = await ManagerVerification.findById(verification._id)
        .populate('manager', 'name email role phone companyName isManagerVerified managerVerificationStatus accountStatus')
        .populate('reviewedByAdmin', 'name email role')
        .lean()

      return res.status(200).json({
        success: true,
        message: 'Manager verification status is already up to date.',
        verification: populatedVerification
      })
    }

    verification.status = status
    verification.adminNote = adminNote
    verification.reviewedByAdmin = req.user.userId
    verification.reviewedAt = new Date()
    await verification.save()

    const userUpdate = {
      companyName: verification.companyName,
      isManagerVerified: status === 'verified',
      managerVerificationStatus: status
    }

    await User.findByIdAndUpdate(verification.manager, userUpdate)

    const populatedVerification = await ManagerVerification.findById(verification._id)
      .populate('manager', 'name email role phone companyName isManagerVerified managerVerificationStatus accountStatus')
      .populate('reviewedByAdmin', 'name email role')
      .lean()

    await createNotification({
      userId: verification.manager,
      actorId: req.user.userId,
      title: status === 'verified' ? 'Manager verification approved' : 'Manager verification rejected',
      body: adminNote || (status === 'verified'
        ? 'Your manager account is now verified.'
        : 'Your manager verification was rejected. Please review the admin note and resubmit if needed.'),
      type: 'system',
      relatedEntityType: 'managerVerification',
      relatedEntityId: verification._id,
      actionUrl: '/dashboard',
      priority: 'high',
      skipActor: false
    })

    res.status(200).json({
      success: true,
      message: status === 'verified' ? 'Manager verified successfully.' : 'Manager verification rejected.',
      verification: populatedVerification
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to review manager verification.' })
  }
}


export async function createAnnouncement(req, res) {
  try {
    const {
      title,
      message,
      targetRole = 'all',
      priority = 'normal',
      expiresAt
    } = req.body || {}

    const cleanedTitle = normalizeString(title)
    const cleanedMessage = normalizeString(message)
    const cleanedTargetRole = ['all', 'tenant', 'manager', 'admin'].includes(targetRole) ? targetRole : 'all'
    const cleanedPriority = ['low', 'normal', 'high', 'critical'].includes(priority) ? priority : 'normal'

    if (!cleanedTitle || !cleanedMessage) {
      return res.status(400).json({ message: 'Title and message are required.' })
    }

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null
    if (expiresAt && Number.isNaN(parsedExpiresAt.getTime())) {
      return res.status(400).json({ message: 'Expiration date must be valid.' })
    }

    const announcement = await Announcement.create({
      title: cleanedTitle,
      message: cleanedMessage,
      targetRole: cleanedTargetRole,
      priority: cleanedPriority,
      expiresAt: parsedExpiresAt,
      createdByAdmin: req.user.userId
    })

    const userIds = await getUserIdsByRole(cleanedTargetRole)

    await createBulkNotificationsForUsers(userIds, {
      actorId: req.user.userId,
      title: cleanedTitle,
      body: cleanedMessage,
      type: 'announcement',
      relatedEntityType: 'announcement',
      relatedEntityId: announcement._id,
      actionUrl: `/notifications/announcements/${announcement._id}`,
      priority: cleanedPriority,
      skipActor: false
    })

    res.status(201).json({
      success: true,
      message: 'Announcement sent successfully.',
      announcement,
      notifiedUsers: userIds.length
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to send announcement.' })
  }
}
