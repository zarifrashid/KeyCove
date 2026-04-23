import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { buildMortgageDefaults, buildMortgagePayload, getDownPaymentPercent } from '../lib/mortgage'

export default function useMortgageCalculator({ property = null, autoCalculate = false } = {}) {
  const propertyPrice = property ? (Number(property.salePrice) > 0 ? Number(property.salePrice) : Number(property.price) || 0) : 0
  const propertyId = property?._id || ''
  const propertyTitle = property?.title || ''
  const defaults = useMemo(
    () => buildMortgageDefaults({ propertyId, propertyPrice, propertyTitle }),
    [propertyId, propertyPrice, propertyTitle]
  )

  const [form, setForm] = useState(defaults)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState({ loading: false, error: '' })

  useEffect(() => {
    setForm(defaults)
    setResult(null)
    setStatus({ loading: false, error: '' })
  }, [defaults])

  const updateField = useCallback((field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }, [])

  const updateCostField = useCallback((group, field, value) => {
    setForm((previous) => ({
      ...previous,
      [group]: {
        ...(previous[group] || {}),
        [field]: value
      }
    }))
  }, [])

  const calculateFromForm = useCallback(async (activeForm) => {
    try {
      setStatus({ loading: true, error: '' })
      const { data } = await api.post('/mortgage/calculate', buildMortgagePayload(activeForm))
      setResult(data.estimate)
      setStatus({ loading: false, error: '' })
      return data.estimate
    } catch (error) {
      setStatus({ loading: false, error: error.response?.data?.message || 'Failed to calculate ownership costs.' })
      return null
    }
  }, [])

  const calculate = useCallback(async () => calculateFromForm(form), [calculateFromForm, form])

  const reset = useCallback(() => {
    setForm(defaults)
    setResult(null)
    setStatus({ loading: false, error: '' })

    if (autoCalculate && defaults.propertyPrice) {
      calculateFromForm(defaults)
    }
  }, [autoCalculate, calculateFromForm, defaults])

  useEffect(() => {
    if (!autoCalculate) return
    if (!defaults.propertyPrice) return
    calculateFromForm(defaults)
  }, [autoCalculate, calculateFromForm, defaults])

  const derived = useMemo(() => ({
    downPaymentPercent: getDownPaymentPercent(form)
  }), [form])

  return {
    form,
    result,
    status,
    derived,
    setForm,
    updateField,
    updateCostField,
    calculate,
    reset
  }
}
