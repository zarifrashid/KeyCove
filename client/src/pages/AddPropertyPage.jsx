import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PropertyForm from '../components/property/PropertyForm'
import { api } from '../lib/api'

const INITIAL_FORM = {
  title: '',
  price: '',
  description: '',
  propertyType: 'Apartment',
  listingType: 'rent',
  bedrooms: '1',
  bathrooms: '1',
  squareFeet: '850',
  image: '',
  images: '',
  availableFrom: new Date().toISOString().slice(0, 10),
  amenities: [],
  location: {
    address: '',
    area: '',
    city: 'Dhaka',
    postalCode: '',
    latitude: '',
    longitude: ''
  },
  policies: {
    utilities: 'Owner is responsible',
    pet: 'Allowed',
    income: ''
  },
  nearbyPlaces: {
    school: '',
    bus: '',
    restaurant: ''
  }
}

function mapPropertyToForm(property) {
  return {
    title: property?.title || '',
    price: property?.price ?? '',
    description: property?.description || '',
    propertyType: property?.propertyType || 'Apartment',
    listingType: property?.listingType || 'rent',
    bedrooms: property?.bedrooms ?? '1',
    bathrooms: property?.bathrooms ?? '1',
    squareFeet: property?.squareFeet ?? '850',
    image: property?.image || '',
    images: Array.isArray(property?.images) ? property.images.map((item) => item.url).join(', ') : '',
    availableFrom: property?.availableFrom ? new Date(property.availableFrom).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    amenities: Array.isArray(property?.amenities) ? property.amenities : [],
    location: {
      address: property?.location?.address || '',
      area: property?.location?.area || '',
      city: property?.location?.city || 'Dhaka',
      postalCode: property?.location?.postalCode || '',
      latitude: property?.location?.latitude ?? '',
      longitude: property?.location?.longitude ?? ''
    },
    policies: {
      utilities: property?.policies?.utilities || 'Owner is responsible',
      pet: property?.policies?.pet || 'Allowed',
      income: property?.policies?.income || ''
    },
    nearbyPlaces: {
      school: property?.nearbyPlaces?.school || '',
      bus: property?.nearbyPlaces?.bus || '',
      restaurant: property?.nearbyPlaces?.restaurant || ''
    }
  }
}

export default function AddPropertyPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = useMemo(() => Boolean(id), [id])
  const [form, setForm] = useState(INITIAL_FORM)
  const [pageState, setPageState] = useState({ loading: isEdit, submitting: false, error: '' })

  useEffect(() => {
    if (!isEdit) return

    const fetchProperty = async () => {
      try {
        setPageState((previous) => ({ ...previous, loading: true, error: '' }))
        const { data } = await api.get(`/properties/${id}`)
        setForm(mapPropertyToForm(data.property))
        setPageState((previous) => ({ ...previous, loading: false }))
      } catch (error) {
        setPageState({ loading: false, submitting: false, error: error.response?.data?.message || 'Failed to load the property for editing.' })
      }
    }

    fetchProperty()
  }, [id, isEdit])

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleNestedChange = (group, field, value) => {
    setForm((previous) => ({
      ...previous,
      [group]: {
        ...previous[group],
        [field]: value
      }
    }))
  }

  const handleAmenityToggle = (amenity) => {
    setForm((previous) => {
      const exists = previous.amenities.includes(amenity)
      return {
        ...previous,
        amenities: exists
          ? previous.amenities.filter((item) => item !== amenity)
          : [...previous.amenities, amenity]
      }
    })
  }

  const handleAmenitiesInput = (value) => {
    setForm((previous) => ({
      ...previous,
      amenities: value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }))
  }

  const handleSubmit = async (action) => {
    try {
      setPageState((previous) => ({ ...previous, submitting: true, error: '' }))

      const payload = {
        ...form,
        action
      }

      if (isEdit) {
        await api.put(`/properties/${id}`, payload)
      } else {
        await api.post('/properties', payload)
      }

      navigate('/dashboard', {
        state: {
          refreshManagerProperties: true,
          flashMessage: action === 'publish'
            ? (isEdit ? 'Property updated and published successfully.' : 'Property published successfully.')
            : (isEdit ? 'Draft updated successfully.' : 'Draft saved successfully.')
        }
      })
    } catch (error) {
      setPageState((previous) => ({
        ...previous,
        submitting: false,
        error: error.response?.data?.message || 'Failed to save property.'
      }))
      return
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap add-property-page-wrap">
        <div className="card add-property-form-card">
          {pageState.loading ? (
            <div className="center-box manager-loading-box">Loading property editor...</div>
          ) : (
            <PropertyForm
              form={form}
              error={pageState.error}
              isSubmitting={pageState.submitting}
              isEdit={isEdit}
              onChange={handleChange}
              onNestedChange={handleNestedChange}
              onAmenityToggle={handleAmenityToggle}
              onAmenitiesInput={handleAmenitiesInput}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/dashboard')}
            />
          )}
        </div>
      </div>
    </>
  )
}
