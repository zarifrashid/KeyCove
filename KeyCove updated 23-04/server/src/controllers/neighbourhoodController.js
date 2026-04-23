import jwt from 'jsonwebtoken'
import NeighbourhoodInsight from '../models/NeighbourhoodInsight.js'
import Property from '../models/Property.js'
import { generateNeighbourhoodInsightForProperty } from '../services/neighbourhood/insightGenerator.js'

function getOptionalRequesterId(req) {
  const token = req.cookies?.token
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret')
    return decoded.userId || null
  } catch (_) {
    return null
  }
}

async function getAccessibleProperty(req) {
  const property = await Property.findById(req.params.id).populate('manager', 'name email role').lean()

  if (!property || property.status === 'deleted') {
    return { property: null, error: { status: 404, message: 'Property not found' } }
  }

  if (property.status !== 'active') {
    const requesterId = getOptionalRequesterId(req)
    const ownerId = property.manager?._id ? property.manager._id.toString() : property.manager?.toString?.()

    if (!requesterId || requesterId !== ownerId) {
      return { property: null, error: { status: 404, message: 'Property not found' } }
    }
  }

  return { property, error: null }
}

export async function getNeighbourhoodInsightByProperty(req, res) {
  try {
    const { property, error } = await getAccessibleProperty(req)

    if (error) {
      return res.status(error.status).json({ message: error.message })
    }

    let insight = await NeighbourhoodInsight.findOne({ property: property._id }).lean()

    if (!insight || insight.coverageStatus === 'unsupported' || insight.coverageStatus === 'failed') {
      const generatedInsight = await generateNeighbourhoodInsightForProperty(property)
      insight = generatedInsight ? generatedInsight.toObject?.() || generatedInsight : null
    }

    res.status(200).json({
      success: true,
      propertyId: property._id,
      insight
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load neighbourhood insight.' })
  }
}

export async function refreshNeighbourhoodInsight(req, res) {
  try {
    const property = await Property.findById(req.params.id)

    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.manager.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only refresh insights for your own property listings.' })
    }

    const insight = await generateNeighbourhoodInsightForProperty(property)

    res.status(200).json({
      success: true,
      message: 'Neighbourhood insights refreshed successfully.',
      insight
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to refresh neighbourhood insight.' })
  }
}
