import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import ApplicationModeSelector from '../components/roommates/ApplicationModeSelector'
import RoommateModeSelector from '../components/roommates/RoommateModeSelector'
import KnownRoommateForm from '../components/roommates/KnownRoommateForm'
import RoommateSearchPanel from '../components/roommates/RoommateSearchPanel'

function formatMoney(value, suffix = '') {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

function getRentPrice(property) {
  if (Number(property?.rentPrice) > 0) return Number(property.rentPrice)
  if (property?.listingType === 'rent' && Number(property?.price) > 0) return Number(property.price)
  return 0
}

function getSalePrice(property) {
  if (Number(property?.salePrice) > 0) return Number(property.salePrice)
  if (property?.listingType === 'sale' && Number(property?.price) > 0) return Number(property.price)
  return 0
}

const ACTION_COPY = {
  rent: {
    title: 'Rent Property',
    submitLabel: 'Apply for Rent',
    helper: 'Your saved application details are filled in from the backend. Review them and send your rent request to the manager.'
  },
  lease: {
    title: 'Lease Property',
    submitLabel: 'Apply for Lease',
    helper: 'Choose how many months you want to lease this property. The total is calculated automatically from the monthly rent.'
  },
  buy: {
    title: 'Buy Property',
    submitLabel: 'Apply to Buy',
    helper: 'Your saved application details are loaded from the backend. Review the sale price and submit your purchase interest.'
  }
}

export default function PropertyActionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const actionType = searchParams.get('type')
  const [property, setProperty] = useState(null)
  const [applicationMode, setApplicationMode] = useState('')
  const [roommateMode, setRoommateMode] = useState('')
  const [leaseMonths, setLeaseMonths] = useState('12')
  const [note, setNote] = useState('')
  const [applicationDetails, setApplicationDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    occupation: user?.applicationProfile?.occupation || '',
    monthlyIncome: user?.applicationProfile?.monthlyIncome ?? '',
    employmentStatus: user?.applicationProfile?.employmentStatus || '',
    employerName: user?.applicationProfile?.employerName || '',
    currentAddress: user?.applicationProfile?.currentAddress || '',
    additionalInfo: user?.applicationProfile?.additionalInfo || ''
  })
  const [pricingPreview, setPricingPreview] = useState({ applicationFee: 0, serviceFee: 0 })
  const [state, setState] = useState({ loading: true, submitting: false, error: '', success: '' })

  const copy = ACTION_COPY[actionType]

  useEffect(() => {
    const fetchPropertyAndPrefill = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: '' }))
        const [{ data: propertyData }, { data: prefillData }] = await Promise.all([
          api.get(`/properties/${id}`),
          api.get(`/property-requests/prefill/${id}?type=${actionType}`)
        ])

        setProperty(propertyData.property)

        const prefillRoot = prefillData.prefill || {}
        const autoFilled = prefillRoot.autoFilled || prefillRoot
        const suggestions = prefillRoot.suggestions || {}

        setApplicationDetails({
          name: autoFilled.name || user?.name || '',
          email: autoFilled.email || user?.email || '',
          phone: autoFilled.phone || user?.phone || '',
          occupation: autoFilled.occupation || '',
          monthlyIncome: autoFilled.monthlyIncome ?? '',
          employmentStatus: autoFilled.employmentStatus || '',
          employerName: autoFilled.employerName || '',
          currentAddress: autoFilled.currentAddress || '',
          additionalInfo: autoFilled.additionalInfo || ''
        })

        if (actionType === 'lease' && suggestions.suggestedLeaseMonths) {
          setLeaseMonths(String(suggestions.suggestedLeaseMonths))
        }

        setPricingPreview(prefillRoot.pricingPreview || {
          applicationFee: 0,
          serviceFee: 0
        })
        setState((previous) => ({ ...previous, loading: false }))
      } catch (error) {
        setState({
          loading: false,
          submitting: false,
          error: error.response?.data?.message || 'Failed to load property request form.',
          success: ''
        })
      }
    }

    if (id && actionType) {
      setApplicationMode(actionType === 'buy' ? 'alone' : '')
      setRoommateMode('')
      fetchPropertyAndPrefill()
    }
  }, [actionType, id, user?.applicationProfile, user?.email, user?.name, user?.phone])

  const monthlyRent = useMemo(() => getRentPrice(property), [property])
  const salePrice = useMemo(() => getSalePrice(property), [property])
  const totalLeaseCost = useMemo(() => {
    const months = Number(leaseMonths || 0)
    return months > 0 ? monthlyRent * months : 0
  }, [leaseMonths, monthlyRent])

  const availability = useMemo(() => ({
    rent: monthlyRent > 0,
    lease: monthlyRent > 0,
    buy: salePrice > 0
  }), [monthlyRent, salePrice])

  const estimatedFees = useMemo(() => ({
    applicationFee: Number(pricingPreview?.applicationFee || 0),
    serviceFee: Number(pricingPreview?.serviceFee || 0)
  }), [pricingPreview])

  const finalCostSummary = useMemo(() => {
    const baseAmount = actionType === 'lease'
      ? totalLeaseCost
      : actionType === 'buy'
        ? salePrice
        : monthlyRent

    return {
      baseAmount,
      additionalFees: estimatedFees.applicationFee + estimatedFees.serviceFee,
      total: baseAmount + estimatedFees.applicationFee + estimatedFees.serviceFee
    }
  }, [actionType, estimatedFees.applicationFee, estimatedFees.serviceFee, monthlyRent, salePrice, totalLeaseCost])

  const handleFieldChange = (field, value) => {
    setApplicationDetails((previous) => ({ ...previous, [field]: value }))
  }

  if (!copy) return <Navigate to={`/properties/${id}`} replace />
  if (user?.role !== 'tenant') return <Navigate to={`/properties/${id}`} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setState((previous) => ({ ...previous, submitting: true, error: '', success: '' }))
      const payload = {
        propertyId: id,
        actionType,
        leaseMonths: actionType === 'lease' ? Number(leaseMonths) : undefined,
        message: note,
        phone: applicationDetails.phone,
        occupation: applicationDetails.occupation,
        monthlyIncome: Number(applicationDetails.monthlyIncome || 0),
        employmentStatus: applicationDetails.employmentStatus,
        employerName: applicationDetails.employerName,
        currentAddress: applicationDetails.currentAddress,
        additionalInfo: applicationDetails.additionalInfo,
        applicationDetails: {
          phone: applicationDetails.phone,
          occupation: applicationDetails.occupation,
          monthlyIncome: Number(applicationDetails.monthlyIncome || 0),
          employmentStatus: applicationDetails.employmentStatus,
          employerName: applicationDetails.employerName,
          currentAddress: applicationDetails.currentAddress,
          additionalInfo: applicationDetails.additionalInfo
        }
      }
      await api.post('/property-requests', payload)
      setState({
        loading: false,
        submitting: false,
        error: '',
        success: 'Your request was sent to the manager successfully.'
      })
      setTimeout(() => {
        navigate('/dashboard')
      }, 800)
    } catch (error) {
      setState((previous) => ({
        ...previous,
        submitting: false,
        error: error.response?.data?.message || 'Failed to send your request.'
      }))
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap dashboard-stack">
        <section className="card property-action-card">
          {state.loading ? <p>Loading property request form...</p> : null}
          {state.error ? <p className="error-text">{state.error}</p> : null}
          {state.success ? <p className="success-text">{state.success}</p> : null}

          {property && !state.loading ? (
            <>
              {actionType !== 'buy' && !applicationMode ? (
                <ApplicationModeSelector actionType={actionType} onSelect={setApplicationMode} />
              ) : null}

              {actionType !== 'buy' && applicationMode === 'roommates' && !roommateMode ? (
                <RoommateModeSelector
                  onSelect={setRoommateMode}
                  onBack={() => setApplicationMode('')}
                />
              ) : null}

              {actionType !== 'buy' && applicationMode === 'roommates' && roommateMode === 'known' ? (
                <KnownRoommateForm
                  property={property}
                  actionType={actionType}
                  leaseMonths={leaseMonths}
                  onBack={() => setRoommateMode('')}
                />
              ) : null}

              {actionType !== 'buy' && applicationMode === 'roommates' && roommateMode === 'unknown' ? (
                <RoommateSearchPanel
                  property={property}
                  actionType={actionType}
                  leaseMonths={leaseMonths}
                  onBack={() => setRoommateMode('')}
                />
              ) : null}

              {(actionType === 'buy' || applicationMode === 'alone') ? (
                <form className="property-action-form" onSubmit={handleSubmit}>
              <div className="property-action-topline">
                <p className="badge">Tenant Action</p>
                <h1>{copy.title}</h1>
                <p>{copy.helper}</p>
              </div>

              <div className="property-action-summary">
                <img src={property.image} alt={property.title} className="property-action-image" />
                <div>
                  <h2>{property.title}</h2>
                  <p>{property.location?.address}, {property.location?.area}, {property.location?.city}</p>
                  {actionType === 'rent' ? <strong>{formatMoney(monthlyRent, '/ month')}</strong> : null}
                  {actionType === 'lease' ? <strong>{formatMoney(monthlyRent, '/ month')}</strong> : null}
                  {actionType === 'buy' ? <strong>{formatMoney(salePrice)}</strong> : null}
                </div>
              </div>

              {!availability[actionType] ? (
                <div className="property-action-unavailable">
                  <strong>This action is not available for this property yet.</strong>
                  <p>
                    {actionType === 'buy'
                      ? 'This listing does not currently have a sale price.'
                      : 'This listing does not currently have a monthly rent amount.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="property-action-prefill-banner">
                    <strong>Backend-filled application</strong>
                    <p>
                      These values are loaded from your saved application profile and latest request data. Update anything
                      that changed before submitting.
                    </p>
                  </div>

                  <div className="property-action-grid">
                    <label className="property-field">
                      <span>Tenant Name</span>
                      <input value={applicationDetails.name} readOnly />
                    </label>
                    <label className="property-field">
                      <span>Email</span>
                      <input value={applicationDetails.email} readOnly />
                    </label>
                    <label className="property-field">
                      <span>Phone Number</span>
                      <input
                        value={applicationDetails.phone}
                        onChange={(event) => handleFieldChange('phone', event.target.value)}
                        placeholder="Enter your phone number"
                        required
                      />
                    </label>
                    <label className="property-field">
                      <span>Occupation / Profession</span>
                      <input
                        value={applicationDetails.occupation}
                        onChange={(event) => handleFieldChange('occupation', event.target.value)}
                        placeholder="Enter your occupation"
                        required
                      />
                    </label>
                    <label className="property-field">
                      <span>Monthly Income</span>
                      <input
                        type="number"
                        min="0"
                        value={applicationDetails.monthlyIncome}
                        onChange={(event) => handleFieldChange('monthlyIncome', event.target.value)}
                        placeholder="Enter your monthly income"
                        required
                      />
                    </label>
                    <label className="property-field">
                      <span>Employment Status</span>
                      <select
                        value={applicationDetails.employmentStatus}
                        onChange={(event) => handleFieldChange('employmentStatus', event.target.value)}
                        required
                      >
                        <option value="">Select status</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="self-employed">Self-employed</option>
                        <option value="contract">Contract</option>
                        <option value="student">Student</option>
                        <option value="unemployed">Unemployed</option>
                      </select>
                    </label>
                    <label className="property-field">
                      <span>Employer / Company</span>
                      <input
                        value={applicationDetails.employerName}
                        onChange={(event) => handleFieldChange('employerName', event.target.value)}
                        placeholder="Company or organization name"
                      />
                    </label>
                    <label className="property-field">
                      <span>Current Address</span>
                      <input
                        value={applicationDetails.currentAddress}
                        onChange={(event) => handleFieldChange('currentAddress', event.target.value)}
                        placeholder="Your current address"
                      />
                    </label>
                  </div>

                  <label className="property-field full-width">
                    <span>Additional Personal / Financial Information</span>
                    <textarea
                      value={applicationDetails.additionalInfo}
                      onChange={(event) => handleFieldChange('additionalInfo', event.target.value)}
                      rows="4"
                      placeholder="Add any supporting details the manager should know"
                    />
                  </label>

                  {actionType === 'rent' ? (
                    <div className="property-action-highlight">
                      <span>Monthly Rent</span>
                      <strong>{formatMoney(monthlyRent, '/ month')}</strong>
                    </div>
                  ) : null}

                  {actionType === 'lease' ? (
                    <div className="property-action-grid property-action-grid--lease">
                      <label className="property-field">
                        <span>Monthly Rent</span>
                        <input value={formatMoney(monthlyRent, '/ month')} readOnly />
                      </label>
                      <label className="property-field">
                        <span>Number of Months</span>
                        <input
                          type="number"
                          min="1"
                          value={leaseMonths}
                          onChange={(event) => setLeaseMonths(event.target.value)}
                          required
                        />
                      </label>
                      <label className="property-field">
                        <span>Total Lease Cost</span>
                        <input value={formatMoney(totalLeaseCost)} readOnly />
                      </label>
                    </div>
                  ) : null}

                  {actionType === 'buy' ? (
                    <div className="property-action-highlight">
                      <span>Sale Price</span>
                      <strong>{formatMoney(salePrice)}</strong>
                    </div>
                  ) : null}

                  <div className="property-action-cost-summary">
                    <div className="property-action-cost-header">
                      <div>
                        <span className="badge">Final Summary</span>
                        <h3>Application Cost Summary</h3>
                      </div>
                      <strong>{formatMoney(finalCostSummary.total)}</strong>
                    </div>
                    <div className="property-action-cost-grid">
                      <p><span>Base Amount</span><strong>{formatMoney(finalCostSummary.baseAmount)}</strong></p>
                      <p><span>Additional Fees</span><strong>{formatMoney(finalCostSummary.additionalFees)}</strong></p>
                      <p><span>Total</span><strong>{formatMoney(finalCostSummary.total)}</strong></p>
                    </div>
                  </div>

                  <label className="property-field full-width">
                    <span>Message to Manager (Optional)</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows="4"
                      placeholder="Write a short message or preference for the manager"
                    />
                  </label>

                  <div className="property-action-buttons">
                    <button type="submit" className="primary-btn" disabled={state.submitting || !availability[actionType]}>
                      {state.submitting ? 'Sending...' : copy.submitLabel}
                    </button>
                    <Link to={`/properties/${id}`} className="secondary-btn">Back to Property</Link>
                  </div>
                </>
              )}
                </form>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </>
  )
}
