import mongoose from 'mongoose'
import Favorite from '../models/Favorite.js'
import Property from '../models/Property.js'
import Recommendation from '../models/Recommendation.js'
import { logInteraction } from '../services/recommendations/interactionService.js'
import { inferUserPreferences } from '../services/recommendations/preferenceService.js'

function ensureTenant(req, res) {
  if (req.user?.role !== 'tenant') {
    res.status(403).json({ message: 'Tenant access only.' })
    return false
  }
  return true
}

async function validateProperty(propertyId) {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return { error: 'Invalid property ID.' }
  }

  const property = await Property.findById(propertyId).select('_id status manager').lean()
  if (!property || property.status === 'deleted' || property.status === 'inactive') {
    return { error: 'Property not found or unavailable.' }
  }

  return { property }
}

export async function getBookmarks(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const favorites = await Favorite.find({ tenant: req.user.userId })
      .populate({
        path: 'property',
        populate: { path: 'manager', select: 'name email role' }
      })
      .sort({ createdAt: -1 })
      .lean()

    const safeFavorites = favorites.filter((item) => item.property && item.property.status === 'active')

    res.status(200).json({
      success: true,
      favorites: safeFavorites,
      favoriteIds: safeFavorites.map((item) => String(item.property?._id || item.property))
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch bookmarks.' })
  }
}

export async function addBookmark(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const { propertyId, recommendationId = null } = req.body || {}
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required.' })
    }

    const { error } = await validateProperty(propertyId)
    if (error) {
      return res.status(404).json({ message: error })
    }

    const existingFavorite = await Favorite.findOne({ tenant: req.user.userId, property: propertyId }).lean()

    if (!existingFavorite) {
      await Favorite.create({ tenant: req.user.userId, property: propertyId })

      await logInteraction({
        userId: req.user.userId,
        propertyId,
        interactionType: 'save',
        source: 'bookmark',
        recommendationId
      })

      if (recommendationId) {
        await Recommendation.findOneAndUpdate(
          { _id: recommendationId, user: req.user.userId },
          { feedbackType: 'saved' }
        )
      }

      await inferUserPreferences(req.user.userId)
    }

    const favorite = await Favorite.findOne({ tenant: req.user.userId, property: propertyId })
      .populate({
        path: 'property',
        populate: { path: 'manager', select: 'name email role' }
      })
      .lean()

    res.status(existingFavorite ? 200 : 201).json({
      success: true,
      alreadyBookmarked: Boolean(existingFavorite),
      favorite,
      message: existingFavorite ? 'Property already saved.' : 'Property saved.'
    })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(200).json({ success: true, alreadyBookmarked: true, message: 'Property already saved.' })
    }
    res.status(500).json({ message: error.message || 'Failed to save property.' })
  }
}

export async function removeBookmark(req, res) {
  try {
    if (!ensureTenant(req, res)) return

    const { propertyId } = req.params
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required.' })
    }

    await Favorite.findOneAndDelete({ tenant: req.user.userId, property: propertyId })
    res.status(200).json({ success: true, message: 'Bookmark removed.' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove bookmark.' })
  }
}
