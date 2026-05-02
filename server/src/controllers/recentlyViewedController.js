import mongoose from 'mongoose'
import Property from '../models/Property.js'
import RecentlyViewed from '../models/RecentlyViewed.js'

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value)
}

function buildPropertySummary(property) {
  if (!property) return null

  return {
    _id: property._id,
    title: property.title,
    description: property.description,
    price: property.price,
    salePrice: property.salePrice,
    rentPrice: property.rentPrice,
    propertyType: property.propertyType,
    listingType: property.listingType,
    status: property.status,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFeet,
    image: property.image,
    imageAlt: property.imageAlt,
    location: property.location
  }
}

function buildRecentlyViewedItem(record) {
  return {
    _id: record._id,
    viewedAt: record.viewedAt,
    property: buildPropertySummary(record.property)
  }
}

export async function addRecentlyViewed(req, res) {
  try {
    const { propertyId } = req.body || {}

    if (!propertyId || !isValidObjectId(propertyId)) {
      return res.status(400).json({ message: 'Valid property ID is required.' })
    }

    const property = await Property.findById(propertyId).select('_id status')
    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found.' })
    }

    const record = await RecentlyViewed.findOneAndUpdate(
      { user: req.user.userId, property: property._id },
      {
        $set: { viewedAt: new Date() },
        $setOnInsert: { user: req.user.userId, property: property._id }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    return res.status(200).json({ message: 'Property saved to recently viewed.', item: record })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(200).json({ message: 'Property saved to recently viewed.' })
    }

    console.error('Add recently viewed error:', error)
    return res.status(500).json({ message: 'Failed to save recently viewed property.' })
  }
}

export async function getRecentlyViewed(req, res) {
  try {
    const page = Math.max(Number(req.query?.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query?.limit) || 12, 1), 50)
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      RecentlyViewed.find({ user: req.user.userId })
        .sort({ viewedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('property', 'title description price salePrice rentPrice propertyType listingType status bedrooms bathrooms squareFeet image imageAlt location'),
      RecentlyViewed.countDocuments({ user: req.user.userId })
    ])

    const items = records
      .filter((record) => record.property && !['deleted', 'inactive'].includes(record.property.status))
      .map(buildRecentlyViewedItem)

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get recently viewed error:', error)
    return res.status(500).json({ message: 'Failed to load recently viewed properties.' })
  }
}

export async function removeRecentlyViewed(req, res) {
  try {
    const { propertyId } = req.params

    if (!propertyId || !isValidObjectId(propertyId)) {
      return res.status(400).json({ message: 'Valid property ID is required.' })
    }

    await RecentlyViewed.deleteOne({ user: req.user.userId, property: propertyId })

    return res.json({ message: 'Property removed from recently viewed.' })
  } catch (error) {
    console.error('Remove recently viewed error:', error)
    return res.status(500).json({ message: 'Failed to remove recently viewed property.' })
  }
}

export async function clearRecentlyViewed(req, res) {
  try {
    await RecentlyViewed.deleteMany({ user: req.user.userId })

    return res.json({ message: 'Recently viewed properties cleared.' })
  } catch (error) {
    console.error('Clear recently viewed error:', error)
    return res.status(500).json({ message: 'Failed to clear recently viewed properties.' })
  }
}
