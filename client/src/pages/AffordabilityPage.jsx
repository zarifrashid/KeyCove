import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'
import AffordabilityForm from '../components/affordability/AffordabilityForm'
import AffordabilityResultCard from '../components/affordability/AffordabilityResultCard'
import AffordabilityHistoryList from '../components/affordability/AffordabilityHistoryList'

const DEFAULT_FORM = {
  monthlyIncome: '',
  monthlyDebt: '',
  savingsBuffer: ''
}

export default function AffordabilityPage() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState({ loading: true, submitting: false, error: '', success: '' })

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [{ data: latestData }, { data: historyData }] = await Promise.all([
          api.get('/affordability/latest'),
          api.get('/affordability/history')
        ])

        if (latestData.analysis) {
          setForm({
            monthlyIncome: String(latestData.analysis.monthlyIncome || ''),
            monthlyDebt: String(latestData.analysis.monthlyDebt || ''),
            savingsBuffer: String(latestData.analysis.savingsBuffer || '')
          })
          setProfile(latestData.profile)
          localStorage.setItem('keycoveAffordabilityProfile', JSON.stringify(latestData.profile))
        }

        setHistory(historyData.history || [])
        setStatus({ loading: false, submitting: false, error: '', success: '' })
      } catch (error) {
        setStatus({ loading: false, submitting: false, error: error.response?.data?.message || 'Failed to load affordability data.', success: '' })
      }
    }

    fetchInitialData()
  }, [])

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const submit = async (mode) => {
    try {
      setStatus((previous) => ({ ...previous, submitting: true, error: '', success: '' }))
      const endpoint = mode === 'save' ? '/affordability/save' : '/affordability/calculate'
      const { data } = await api.post(endpoint, form)
      setProfile(data.profile)
      localStorage.setItem('keycoveAffordabilityProfile', JSON.stringify(data.profile))
      if (mode === 'save') {
        const historyResponse = await api.get('/affordability/history')
        setHistory(historyResponse.data.history || [])
      }
      setStatus((previous) => ({
        ...previous,
        submitting: false,
        success: mode === 'save' ? 'Affordability profile saved successfully.' : 'Affordability calculated successfully.'
      }))
    } catch (error) {
      setStatus((previous) => ({
        ...previous,
        submitting: false,
        error: error.response?.data?.message || 'Failed to process affordability profile.'
      }))
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap affordability-page-wrap">
        <div className="affordability-page-shell">
          {status.loading ? <div className="card"><p>Loading affordability tool...</p></div> : null}
          {!status.loading ? (
            <>
              <AffordabilityForm
                values={form}
                onChange={handleChange}
                onCalculate={() => submit('calculate')}
                onSave={() => submit('save')}
                loading={status.submitting}
              />

              {status.error ? <p className="error-text affordability-flash-text">{status.error}</p> : null}
              {status.success ? <p className="success-text affordability-flash-text">{status.success}</p> : null}

              <AffordabilityResultCard profile={profile} />
              <AffordabilityHistoryList history={history} />
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
