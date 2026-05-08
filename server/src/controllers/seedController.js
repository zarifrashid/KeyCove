import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Property from '../models/Property.js'
import { buildNewDhakaProperties } from '../data/dhakaSeedData.js'

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
        emailVerified: true,
        emailVerifiedAt: new Date(),
        role: 'manager',
        phone: '+8801711000000',
        companyName: 'KeyCove Realty'
      })
    } else if (manager.emailVerified === false) {
      manager.emailVerified = true
      manager.emailVerifiedAt = manager.emailVerifiedAt || new Date()
      await manager.save()
    }

    const propertyDocs = buildNewDhakaProperties(manager._id)
    const results = await Promise.all(propertyDocs.map((propertyDoc) => (
      Property.findOneAndUpdate(
        { seedKey: propertyDoc.seedKey },
        { $set: propertyDoc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )))

    res.status(201).json({
      success: true,
      message: '20 new Dhaka demo properties were seeded or updated successfully.',
      createdOrUpdatedCount: results.length,
      demoManager: {
        email: managerEmail,
        password: 'manager123'
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to seed properties' })
  }
}
