import ManagerVerification from '../models/ManagerVerification.js'
import User from '../models/User.js'

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function normalizeDocumentType(value) {
  const nextValue = normalizeString(value, 'other')
  return ['nid', 'trade_license', 'company_registration', 'broker_license', 'other'].includes(nextValue) ? nextValue : 'other'
}

export async function getMyManagerVerification(req, res) {
  try {
    const verification = await ManagerVerification.findOne({ manager: req.user.userId })
      .populate('reviewedByAdmin', 'name email role')
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({ success: true, verification: verification || null })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load verification status.' })
  }
}

export async function submitManagerVerification(req, res) {
  try {
    const {
      companyName,
      businessEmail,
      businessPhone,
      licenseNumber,
      businessAddress,
      city,
      state,
      country,
      yearsOfExperience,
      documentType,
      documentUrl,
      verificationMessage
    } = req.body || {}

    const cleanedCompanyName = normalizeString(companyName || req.user.companyName)
    const cleanedDocumentUrl = normalizeString(documentUrl)

    if (!cleanedCompanyName || !cleanedDocumentUrl) {
      return res.status(400).json({ message: 'Company name and document URL are required.' })
    }

    const existingPending = await ManagerVerification.findOne({ manager: req.user.userId, status: 'pending' })
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending verification request.' })
    }

    const verification = await ManagerVerification.create({
      manager: req.user.userId,
      companyName: cleanedCompanyName,
      businessEmail: normalizeString(businessEmail).toLowerCase(),
      businessPhone: normalizeString(businessPhone),
      licenseNumber: normalizeString(licenseNumber),
      businessAddress: normalizeString(businessAddress),
      city: normalizeString(city),
      state: normalizeString(state),
      country: normalizeString(country),
      yearsOfExperience: Math.max(0, Number(yearsOfExperience) || 0),
      documentType: normalizeDocumentType(documentType),
      documentUrl: cleanedDocumentUrl,
      verificationMessage: normalizeString(verificationMessage),
      status: 'pending'
    })

    await User.findByIdAndUpdate(req.user.userId, {
      companyName: cleanedCompanyName,
      managerVerificationStatus: 'pending',
      isManagerVerified: false
    })

    const populatedVerification = await ManagerVerification.findById(verification._id)
      .populate('reviewedByAdmin', 'name email role')
      .lean()

    res.status(201).json({
      success: true,
      message: 'Verification request submitted for admin review.',
      verification: populatedVerification
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit verification request.' })
  }
}
