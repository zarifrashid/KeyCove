import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { calculateMortgage } from '../controllers/mortgageController.js'

const router = express.Router()

router.use(protect)
router.post('/calculate', calculateMortgage)

export default router
