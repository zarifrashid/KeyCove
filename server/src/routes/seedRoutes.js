import express from 'express'
import { seedDhakaProperties } from '../controllers/seedController.js'

const router = express.Router()

router.post('/dhaka-properties', seedDhakaProperties)

export default router
