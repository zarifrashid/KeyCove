import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import MortgageCalculatorForm from './MortgageCalculatorForm'
import MortgageResultCard from './MortgageResultCard'
import CostBreakdownCard from './CostBreakdownCard'
import MortgageHistoryList from './MortgageHistoryList'

const DEFAULT_FIELDS = {
  listingPrice: '',
  downPaymentPercent: '20',
  loanTermYears: '20',
  interestRate: '9',
  estimatedTax: '0',
  estimatedInsurance: '0',
  estimatedUtilities: '0',
  hoaFee: '0'
}

function mapHistoryItemToForm(item, listingPriceOverride = '') {
  return {
    listingPrice: String(listingPriceOverride || item.listingPrice || ''),
    downPaymentPercent: String(item.downPaymentPercent ?? 20),
    loanTermYears: String(item.loanTermYears ?? 20),
    interestRate: String(item.interestRate ?? 9),
    estimatedTax: String(item.estimatedTax ?? 0),
    estimatedInsurance: String(item.estimatedInsurance ?? 0),
    estimatedUtilities: String(item.estimatedUtilities ?? 0),
    hoaFee: String(item.hoaFee ?? 0)
  }
}

export default function PropertyMortgageWidget({ property }) {
  const defaults = useMemo(() => ({ ...DEFAULT_FIELDS, listingPrice: String(property?.price || '') }), [property?.price])
  const [form, setForm] = useState(defaults)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState({ loading: false, saving: false, error: '', success: '' })

  useEffect(() => {
    setForm(defaults)
    setResult(null)
    setStatus({ loading: false, saving: false, error: '', success: '' })
  }, [defaults])

  useEffect(() => {
    const fetchHistory = async () => {
      if (!property?._id) return
      try {
        const { data } = await api.get(`/mortgage/history?propertyId=${property._id}`)
        setHistory(data.history || [])
      } catch (_) {
        setHistory([])
      }
    }

    fetchHistory()
  }, [property?._id])

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const calculate = async () => {
    try {
      setStatus({ loading: true, saving: false, error: '', success: '' })
      const { data } = await api.post(`/mortgage/property/${property._id}/calculate`, form)
      setResult(data.result)
      setStatus({ loading: false, saving: false, error: '', success: 'Mortgage calculated successfully.' })
    } catch (error) {
      setStatus({ loading: false, saving: false, error: error.response?.data?.message || 'Failed to calculate mortgage.', success: '' })
    }
  }

  const save = async () => {
    try {
      setStatus((previous) => ({ ...previous, saving: true, error: '', success: '' }))
      const { data } = await api.post(`/mortgage/property/${property._id}/save`, form)
      setResult(data.result)
      const historyResponse = await api.get(`/mortgage/history?propertyId=${property._id}`)
      setHistory(historyResponse.data.history || [])
      setStatus({ loading: false, saving: false, error: '', success: 'Mortgage scenario saved.' })
    } catch (error) {
      setStatus({ loading: false, saving: false, error: error.response?.data?.message || 'Failed to save mortgage scenario.', success: '' })
    }
  }

  const reset = () => {
    setForm(defaults)
    setResult(null)
    setStatus({ loading: false, saving: false, error: '', success: '' })
  }

  const exportScenario = () => {
    const exportPayload = {
      propertyId: property?._id,
      propertyTitle: property?.title,
      propertyPrice: property?.price,
      inputs: form,
      result,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `keycove-mortgage-${property?._id || 'scenario'}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (property?.listingType !== 'sale') {
    return (
      <section className="property-affordability-widget mortgage-rental-note">
        <div className="section-heading-row compact-heading-row">
          <div>
            <h3>Mortgage calculator</h3>
            <p>This tool is available for ownership / sale listings only.</p>
          </div>
          <span className="affordability-status-chip">Rent listing</span>
        </div>
        <p className="muted-text">This property is a rental listing, so financing and ownership-cost calculations are not shown here.</p>
        <Link to="/affordability" className="secondary-btn">Use affordability check</Link>
      </section>
    )
  }

  return (
    <section className="mortgage-property-shell">
      <MortgageCalculatorForm
        values={form}
        onChange={handleChange}
        onCalculate={calculate}
        onReset={reset}
        onSave={save}
        onExport={exportScenario}
        loading={status.loading}
        saving={status.saving}
        listingPriceLocked
      />
      {status.error ? <p className="error-text affordability-flash-text">{status.error}</p> : null}
      {status.success ? <p className="success-text affordability-flash-text">{status.success}</p> : null}
      <div className="mortgage-dual-grid">
        <MortgageResultCard result={result} propertyLabel={`Linked to ${property.title}`} />
        <CostBreakdownCard result={result} />
      </div>
      <MortgageHistoryList
        history={history}
        onLoad={(item) => {
          setForm(mapHistoryItemToForm(item, property?.price))
          setResult(null)
          setStatus({ loading: false, saving: false, error: '', success: 'Saved scenario loaded into the form.' })
        }}
      />
    </section>
  )
}
