import { useState } from 'react'

const AREA_OPTIONS = ['Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Bashundhara']
const TYPE_OPTIONS = ['Apartment', 'Studio', 'Condo', 'Family Home']
const LISTING_OPTIONS = ['rent', 'sale']
const AMENITY_OPTIONS = ['', 'Parking', 'Lift', 'Balcony', 'Generator Backup', '24/7 Security', 'Gym']

const INITIAL_FORM = {
  preferredArea: '',
  budgetMin: '',
  budgetMax: '',
  propertyType: '',
  bedrooms: '',
  listingType: 'rent',
  mustHaveAmenity: ''
}

export default function RecommendationOnboarding({ busy = false, onSave, onSkip = null }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.preferredArea || !form.propertyType || !form.listingType) {
      setError('Please answer area, type, and rent or buy.')
      return
    }

    if (form.budgetMin && form.budgetMax && Number(form.budgetMin) > Number(form.budgetMax)) {
      setError('Minimum budget cannot be greater than maximum budget.')
      return
    }

    try {
      await onSave?.(form)
    } catch (submissionError) {
      setError(submissionError?.response?.data?.message || 'Could not save your preferences.')
    }
  }

  return (
    <section className="card recommendation-onboarding-card">
      <div className="recommendation-onboarding-header">
        <div>
          <p className="badge">Quick preference quiz</p>
          <h3>Build your taste profile</h3>
          <p>Tell KeyCove what matters most and the next recommendations will follow those exact choices.</p>
        </div>
        {onSkip ? (
          <button type="button" className="secondary-btn" onClick={onSkip} disabled={busy}>
            Close
          </button>
        ) : null}
      </div>

      <form className="recommendation-onboarding-form" onSubmit={handleSubmit}>
        <label>
          Preferred area
          <select name="preferredArea" value={form.preferredArea} onChange={handleChange}>
            <option value="">Select an area</option>
            {AREA_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label>
          Rent or buy
          <select name="listingType" value={form.listingType} onChange={handleChange}>
            {LISTING_OPTIONS.map((item) => <option key={item} value={item}>{item === 'rent' ? 'Rent' : 'Buy'}</option>)}
          </select>
        </label>

        <label>
          Property type
          <select name="propertyType" value={form.propertyType} onChange={handleChange}>
            <option value="">Select property type</option>
            {TYPE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label>
          Bedrooms
          <select name="bedrooms" value={form.bedrooms} onChange={handleChange}>
            <option value="">Any</option>
            {[1, 2, 3, 4].map((item) => <option key={item} value={String(item)}>{item}</option>)}
          </select>
        </label>

        <label>
          Minimum budget (৳)
          <input name="budgetMin" type="number" value={form.budgetMin} onChange={handleChange} min="0" step="1000" />
        </label>

        <label>
          Maximum budget (৳)
          <input name="budgetMax" type="number" value={form.budgetMax} onChange={handleChange} min="0" step="1000" />
        </label>

        <label>
          One must-have feature
          <select name="mustHaveAmenity" value={form.mustHaveAmenity} onChange={handleChange}>
            {AMENITY_OPTIONS.map((item) => <option key={item || 'none'} value={item}>{item || 'No preference'}</option>)}
          </select>
        </label>

        <div className="recommendation-onboarding-actions">
          <button type="submit" className="primary-btn recommendation-onboarding-submit" disabled={busy}>
            {busy ? 'Saving...' : 'Apply my preferences'}
          </button>
        </div>
      </form>

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}
