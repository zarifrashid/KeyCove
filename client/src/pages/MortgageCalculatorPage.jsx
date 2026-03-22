import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'
import MortgageCalculatorForm from '../components/mortgage/MortgageCalculatorForm'
import MortgageResultCard from '../components/mortgage/MortgageResultCard'
import CostBreakdownCard from '../components/mortgage/CostBreakdownCard'
import MortgageHistoryList from '../components/mortgage/MortgageHistoryList'

const DEFAULT_FORM = {
  listingPrice: '',
  downPaymentPercent: '20',
  loanTermYears: '20',
  interestRate: '9',
  estimatedTax: '0',
  estimatedInsurance: '0',
  estimatedUtilities: '0',
  hoaFee: '0'
}

function mapHistoryItemToForm(item) {
  return {
    listingPrice: String(item.listingPrice || ''),
    downPaymentPercent: String(item.downPaymentPercent ?? 20),
    loanTermYears: String(item.loanTermYears ?? 20),
    interestRate: String(item.interestRate ?? 9),
    estimatedTax: String(item.estimatedTax ?? 0),
    estimatedInsurance: String(item.estimatedInsurance ?? 0),
    estimatedUtilities: String(item.estimatedUtilities ?? 0),
    hoaFee: String(item.hoaFee ?? 0)
  }
}

export default function MortgageCalculatorPage() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState({ loading: false, saving: false, error: '', success: '' })

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/mortgage/history')
      setHistory(data.history || [])
    } catch (_) {
      setHistory([])
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const calculate = async () => {
    try {
      setStatus({ loading: true, saving: false, error: '', success: '' })
      const { data } = await api.post('/mortgage/calculate', form)
      setResult(data.result)
      setStatus({ loading: false, saving: false, error: '', success: 'Mortgage calculated successfully.' })
    } catch (error) {
      setStatus({ loading: false, saving: false, error: error.response?.data?.message || 'Failed to calculate mortgage.', success: '' })
    }
  }

  const save = async () => {
    try {
      setStatus((previous) => ({ ...previous, saving: true, error: '', success: '' }))
      const { data } = await api.post('/mortgage/save', form)
      setResult(data.result)
      await fetchHistory()
      setStatus({ loading: false, saving: false, error: '', success: 'Mortgage scenario saved.' })
    } catch (error) {
      setStatus({ loading: false, saving: false, error: error.response?.data?.message || 'Failed to save mortgage scenario.', success: '' })
    }
  }

  const reset = () => {
    setForm(DEFAULT_FORM)
    setResult(null)
    setStatus({ loading: false, saving: false, error: '', success: '' })
  }

  const exportScenario = () => {
    const exportPayload = {
      inputs: form,
      result,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'keycove-mortgage-scenario.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap affordability-page-wrap">
        <div className="affordability-page-shell mortgage-page-shell">
          <MortgageCalculatorForm
            values={form}
            onChange={handleChange}
            onCalculate={calculate}
            onReset={reset}
            onSave={save}
            onExport={exportScenario}
            loading={status.loading}
            saving={status.saving}
          />
          {status.error ? <p className="error-text affordability-flash-text">{status.error}</p> : null}
          {status.success ? <p className="success-text affordability-flash-text">{status.success}</p> : null}
          <div className="mortgage-dual-grid">
            <MortgageResultCard result={result} propertyLabel="Manual mortgage scenario" />
            <CostBreakdownCard result={result} />
          </div>
          <MortgageHistoryList
            history={history}
            onLoad={(item) => {
              setForm(mapHistoryItemToForm(item))
              setResult(null)
              setStatus({ loading: false, saving: false, error: '', success: 'Saved scenario loaded into the form.' })
            }}
          />
        </div>
      </div>
    </>
  )
}
