import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

const ADMIN_EMAIL = process.env.FIRST_ADMIN_EMAIL || 'admin@keycove.com'
const ADMIN_PASSWORD = process.env.FIRST_ADMIN_PASSWORD || 'Admin12345'

async function createFirstAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing in server/.env')
      process.exit(1)
    }

    await mongoose.connect(process.env.MONGO_URI)

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() })

    if (existingAdmin) {
      existingAdmin.role = 'admin'
      existingAdmin.accountStatus = 'active'
      existingAdmin.adminProfile = existingAdmin.adminProfile || { department: 'Operations', accessLevel: 1 }
      await existingAdmin.save()
      console.log('Admin already exists and is active.')
      console.log(`Email: ${ADMIN_EMAIL}`)
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

    await User.create({
      name: 'KeyCove Admin',
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      accountStatus: 'active',
      adminProfile: {
        department: 'Operations',
        accessLevel: 1
      }
    })

    console.log('First admin created successfully.')
    console.log(`Email: ${ADMIN_EMAIL}`)
    console.log(`Password: ${ADMIN_PASSWORD}`)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

createFirstAdmin()
