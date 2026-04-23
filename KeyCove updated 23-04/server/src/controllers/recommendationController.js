import Favorite from '../models/Favorite.js'
import Property from '../models/Property.js'
import Recommendation from '../models/Recommendation.js'
import UserPreference from '../models/UserPreference.js'
import { logInteraction } from '../services/recommendations/interactionService.js'
import { inferUserPreferences, saveOnboardingPreferences } from '../services/recommendations/preferenceService.js'
import { generateRecommendationsForUser } from '../services/recommendations/recommendationEngine.js'

function ensureTenant(req, res) {
  if (req.user?.role !== 'tenant') {
    res.status(403).json({ message: 'Tenant access only.' })
    return false
  }
  return true
}

function parseExcludeParam(rawValue) {
  if (!rawValue) return []
  return String(rawValue)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function getRecommendations(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 6))
    const excludePropertyIds = parseExcludeParam(req.query.exclude)
    const result = await generateRecommendationsForUser(req.user.userId, { limit, refresh: true, excludePropertyIds })
    res.status(200).json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to generate recommendations.' })
  }
}

export async function markRecommendationFeedback(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const { recommendationId } = req.params
    const { feedbackType } = req.body || {}
    if (!['clicked', 'saved', 'not_interested'].includes(feedbackType)) {
      return res.status(400).json({ message: 'Invalid feedback type.' })
    }

    const recommendation = await Recommendation.findOne({ _id: recommendationId, user: req.user.userId })
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found.' })
    }

    recommendation.feedbackType = feedbackType
    await recommendation.save()

    await logInteraction({
      userId: req.user.userId,
      propertyId: recommendation.property,
      interactionType: feedbackType === 'clicked' ? 'recommendation_click' : feedbackType,
      source: 'recommendation-card',
      recommendationId: recommendation._id,
      algorithmVersion: recommendation.algorithmVersion
    })

    await inferUserPreferences(req.user.userId)

    res.status(200).json({ success: true, message: 'Recommendation feedback recorded.' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update recommendation feedback.' })
  }
}

export async function getFavoriteProperties(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const favorites = await Favorite.find({ tenant: req.user.userId })
      .populate({
        path: 'property',
        populate: { path: 'manager', select: 'name email role' }
      })
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      favorites: favorites.filter((item) => item.property && item.property.status === 'active')
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch favorites.' })
  }
}

export async function addFavorite(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const { propertyId, recommendationId = null } = req.body || {}
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required.' })
    }

    const property = await Property.findOne({ _id: propertyId, status: 'active' }).select('_id')
    if (!property) {
      return res.status(404).json({ message: 'Active property not found.' })
    }

    const favorite = await Favorite.findOneAndUpdate(
      { tenant: req.user.userId, property: propertyId },
      { tenant: req.user.userId, property: propertyId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    await logInteraction({
      userId: req.user.userId,
      propertyId,
      interactionType: 'save',
      source: 'favorite',
      recommendationId
    })

    if (recommendationId) {
      await Recommendation.findOneAndUpdate(
        { _id: recommendationId, user: req.user.userId },
        { feedbackType: 'saved' }
      )
    }

    await inferUserPreferences(req.user.userId)

    res.status(201).json({ success: true, favorite })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(200).json({ success: true, message: 'Property already saved.' })
    }
    res.status(500).json({ message: error.message || 'Failed to save property.' })
  }
}

export async function removeFavorite(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    await Favorite.findOneAndDelete({ tenant: req.user.userId, property: req.params.propertyId })
    res.status(200).json({ success: true, message: 'Favorite removed.' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove favorite.' })
  }
}

export async function getPreferenceSnapshot(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const preference = await UserPreference.findOne({ user: req.user.userId }).lean()
    const interactionSummary = {
      interactions: await Recommendation.countDocuments({ user: req.user.userId }),
      hasOnboarding: Boolean(preference?.onboardingCompleted)
    }
    res.status(200).json({ success: true, preference, interactionSummary })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch user preferences.' })
  }
}

export async function saveRecommendationOnboarding(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const {
      preferredArea,
      budgetMin,
      budgetMax,
      propertyType,
      bedrooms,
      listingType,
      mustHaveAmenity
    } = req.body || {}

    if (!preferredArea || !propertyType || !listingType) {
      return res.status(400).json({ message: 'Preferred area, property type, and listing type are required.' })
    }

    const preference = await saveOnboardingPreferences(req.user.userId, {
      preferredArea,
      budgetMin,
      budgetMax,
      propertyType,
      bedrooms,
      listingType,
      mustHaveAmenity
    })

    const recommendations = await generateRecommendationsForUser(req.user.userId, { limit: 9, refresh: true })

    res.status(200).json({
      success: true,
      message: 'Taste profile saved.',
      preference,
      recommendations
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save onboarding preferences.' })
  }
}
