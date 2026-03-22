import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  calculateMortgage,
  calculateMortgageForProperty,
  getLatestMortgageCalculation,
  getMortgageHistory,
  saveMortgageCalculation,
  saveMortgageCalculationForProperty
} from '../controllers/mortgageController.js'

const router = express.Router()

router.use(protect)

router.get('/latest', getLatestMortgageCalculation)
router.get('/history', getMortgageHistory)
router.post('/calculate', calculateMortgage)
router.post('/save', saveMortgageCalculation)
router.post('/property/:propertyId/calculate', calculateMortgageForProperty)
router.post('/property/:propertyId/save', saveMortgageCalculationForProperty)

export default router
