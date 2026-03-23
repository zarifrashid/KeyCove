import AffordabilityAnalysis from '../models/AffordabilityAnalysis.js'
import { buildPropertyAffordabilitySummary, calculateAffordabilityProfile } from '../services/affordability/affordabilityService.js'

function ensureTenant(req, res) {
  if (req.user?.role !== 'tenant') {
    res.status(403).json({ message: 'Tenant access only.' })
    return false
  }
  return true
}

function validateInputs(body = {}) {
  const monthlyIncome = Number(body.monthlyIncome)
  const monthlyDebt = Number(body.monthlyDebt || 0)
  const savingsBuffer = Number(body.savingsBuffer || 0)

  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
    return 'Monthly income must be greater than 0.'
  }

  if (!Number.isFinite(monthlyDebt) || monthlyDebt < 0) {
    return 'Monthly debt must be 0 or more.'
  }

  if (!Number.isFinite(savingsBuffer) || savingsBuffer < 0) {
    return 'Savings buffer must be 0 or more.'
  }

  return ''
}

export async function calculateAffordability(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const validationError = validateInputs(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const profile = calculateAffordabilityProfile(req.body)
    res.status(200).json({ success: true, profile })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to calculate affordability.' })
  }
}

export async function saveAffordabilityAnalysis(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const validationError = validateInputs(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const profile = calculateAffordabilityProfile(req.body)
    const analysis = await AffordabilityAnalysis.create({
      userId: req.user.userId,
      monthlyIncome: profile.monthlyIncome,
      monthlyDebt: profile.monthlyDebt,
      savingsBuffer: profile.savingsBuffer,
      safeMonthlyRent: profile.safeMonthlyRent,
      recommendedMinRent: profile.recommendedMinRent,
      recommendedMaxRent: profile.recommendedMaxRent,
      affordabilityBand: profile.affordabilityBand,
      affordabilityRule: profile.affordabilityRule
    })

    res.status(201).json({
      success: true,
      message: 'Affordability profile saved.',
      profile,
      analysis
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save affordability profile.' })
  }
}

export async function getLatestAffordability(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const analysis = await AffordabilityAnalysis.findOne({ userId: req.user.userId }).sort({ createdAt: -1 }).lean()
    if (!analysis) {
      return res.status(200).json({ success: true, analysis: null, profile: null })
    }

    const profile = calculateAffordabilityProfile(analysis)
    res.status(200).json({ success: true, analysis, profile })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch affordability profile.' })
  }
}

export async function getAffordabilityHistory(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const history = await AffordabilityAnalysis.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    res.status(200).json({ success: true, history })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch affordability history.' })
  }
}

export async function getPropertyAffordability(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const latestAnalysis = await AffordabilityAnalysis.findOne({ userId: req.user.userId }).sort({ createdAt: -1 }).lean()
    if (!latestAnalysis) {
      return res.status(404).json({ message: 'No saved affordability profile found yet.' })
    }

    const profile = calculateAffordabilityProfile(latestAnalysis)
    const summary = await buildPropertyAffordabilitySummary(req.params.propertyId, profile)
    res.status(200).json({ success: true, summary, profile })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to compare property affordability.' })
  }
}
