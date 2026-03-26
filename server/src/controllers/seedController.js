import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Property from '../models/Property.js'
import { buildDhakaProperties } from '../data/dhakaSeedData.js'

export async function seedDhakaProperties(req, res) {
  try {
    const managerEmail = 'manager@keycove.demo'
    let manager = await User.findOne({ email: managerEmail })

    if (!manager) {
      const hashedPassword = await bcrypt.hash('manager123', 10)
      manager = await User.create({
        name: 'KeyCove Demo Manager',
        email: managerEmail,
        password: hashedPassword,
        role: 'manager'
      })
    }

    await Property.deleteMany({ 'location.city': 'Dhaka' })
    const propertyDocs = buildDhakaProperties(manager._id)
    const created = await Property.insertMany(propertyDocs)

    res.status(201).json({
      success: true,
      message: 'Dhaka map seed created successfully',
      createdCount: created.length,
      demoManager: {
        email: managerEmail,
        password: 'manager123'
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to seed properties' })
  }
}
