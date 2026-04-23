import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MortgageCalculatorForm from '../components/mortgage/MortgageCalculatorForm'
import MortgageResultCard from '../components/mortgage/MortgageResultCard'
import MortgageCostBreakdownCard from '../components/mortgage/MortgageCostBreakdownCard'
import useMortgageCalculator from '../hooks/useMortgageCalculator'
import { api } from '../lib/api'

export default function MortgageCalculatorPage() {
  const [searchParams] = useSearchParams()
  const propertyId = searchParams.get('propertyId') || ''
  const [propertyContext, setPropertyContext] = useState(null)
  const [contextStatus, setContextStatus] = useState({ loading: false, error: '' })

  useEffect(() => {
    const fetchPropertyContext = async () => {
      if (!propertyId) {
        setPropertyContext(null)
        setContextStatus({ loading: false, error: '' })
        return
      }

      try {
        setContextStatus({ loading: true, error: '' })
        const { data } = await api.get(`/properties/${propertyId}`)
        if (data.property?.listingType !== 'sale') {
          setPropertyContext(null)
          setContextStatus({ loading: false, error: 'Mortgage calculator applies to sale listings only. Manual mode is still available below.' })
          return
        }
        setPropertyContext(data.property)
        setContextStatus({ loading: false, error: '' })
      } catch (error) {
        setPropertyContext(null)
        setContextStatus({ loading: false, error: error.response?.data?.message || 'Unable to load sale property context. Manual mode is still available.' })
      }
    }

    fetchPropertyContext()
  }, [propertyId])

  const { form, result, status, updateField, updateCostField, calculate, reset } = useMortgageCalculator({
    property: propertyContext,
    autoCalculate: false
  })

  const pageIntro = useMemo(() => {
    if (propertyContext?.title) {
      return `Manual ownership calculator with ${propertyContext.title} prefilled from property details.`
    }
    return 'Standalone calculator for mortgage and total monthly ownership cost estimation.'
  }, [propertyContext?.title])

  return (
    <>
      <Navbar />
      <div className="page-wrap affordability-page-wrap mortgage-page-wrap">
        <div className="affordability-page-shell mortgage-page-shell">
          <section className="card mortgage-page-hero">
            <div className="section-heading-row compact-heading-row">
              <div>
                <h1>Mortgage & Cost Calculator</h1>
                <p>{pageIntro}</p>
              </div>
              <Link to="/explore" className="secondary-btn">Back to explore</Link>
            </div>
            <div className="mortgage-page-note-grid">
              <div className="mortgage-relationship-note">
                <h3>How this fits with Affordability</h3>
                <p>Affordability in KeyCove is a rent-budget tool. This page focuses on ownership financing burden for sale scenarios.</p>
              </div>
              <div className="mortgage-relationship-note">
                <h3>Current scope</h3>
                <p>Recurring ownership costs are user-entered estimates because the current property schema does not store those numeric values yet.</p>
              </div>
            </div>
            {contextStatus.loading ? <p>Loading sale property context...</p> : null}
            {contextStatus.error ? <p className="error-text">{contextStatus.error}</p> : null}
          </section>

          <MortgageCalculatorForm
            form={form}
            onFieldChange={updateField}
            onCostChange={updateCostField}
            onSubmit={calculate}
            onReset={reset}
            loading={status.loading}
            submitLabel={result ? 'Update estimate' : 'Calculate ownership cost'}
            showContext={Boolean(propertyContext)}
            contextTitle={propertyContext?.title || ''}
          />

          {status.error ? <p className="error-text">{status.error}</p> : null}
          <MortgageResultCard estimate={result} />
          <MortgageCostBreakdownCard estimate={result} />
        </div>
      </div>
    </>
  )
}
