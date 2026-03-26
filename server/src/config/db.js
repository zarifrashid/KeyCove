import mongoose from 'mongoose'

let isDbConnected = false

export function getDbStatus() {
  return isDbConnected
}

export default async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI

    if (!mongoUri) {
      console.log('MongoDB URI is missing. Add MONGODB_URI in server/.env before testing database features.')
      return
    }

    await mongoose.connect(mongoUri)
    isDbConnected = true
    console.log('MongoDB connected')
  } catch (error) {
    isDbConnected = false
    console.error('MongoDB connection failed:', error.message)
  }
}
