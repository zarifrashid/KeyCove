import mongoose from 'mongoose'

const vectorSchema = new mongoose.Schema(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  { _id: false }
)

const furniturePlacementSchema = new mongoose.Schema(
  {
    furnitureId: { type: String, trim: true, required: true },
    roomId: { type: String, trim: true, default: 'living-room' },
    name: { type: String, trim: true, default: 'Furniture' },
    category: { type: String, trim: true, default: 'general' },
    itemType: { type: String, trim: true, default: 'furniture' },
    modelUrl: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '▣' },
    color: { type: String, trim: true, default: '#0f4c81' },
    position: { type: vectorSchema, default: () => ({}) },
    rotation: { type: vectorSchema, default: () => ({}) },
    scale: { type: vectorSchema, default: () => ({ x: 1, y: 1, z: 1 }) },
    dimensions: {
      width: { type: Number, default: 80, min: 20, max: 300 },
      depth: { type: Number, default: 50, min: 20, max: 300 },
      height: { type: Number, default: 40, min: 5, max: 300 }
    }
  },
  { _id: false }
)

const interactionLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['open', 'add-furniture', 'move', 'rotate', 'scale', 'reset', 'save', 'fullscreen', 'load', 'room-switch', 'duplicate', 'delete'],
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)

const arSessionSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scope: {
      type: String,
      enum: ['property_default', 'user_custom'],
      default: 'user_custom',
      index: true
    },
    furniturePlacements: {
      type: [furniturePlacementSchema],
      default: []
    },
    interactionLogs: {
      type: [interactionLogSchema],
      default: []
    },
    viewState: {
      cameraMode: { type: String, trim: true, default: 'orbit' },
      zoom: { type: Number, default: 1, min: 0.25, max: 5 },
      activeRoomId: { type: String, trim: true, default: 'living-room' },
      lastSelectedFurnitureId: { type: String, trim: true, default: '' }
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    },
    savedName: {
      type: String,
      trim: true,
      default: 'My saved room layout'
    }
  },
  { timestamps: true }
)

arSessionSchema.index({ property: 1, user: 1 }, { unique: true })
arSessionSchema.index({ property: 1, scope: 1, updatedAt: -1 })
arSessionSchema.index({ updatedAt: -1 })

export default mongoose.model('ARSession', arSessionSchema)
