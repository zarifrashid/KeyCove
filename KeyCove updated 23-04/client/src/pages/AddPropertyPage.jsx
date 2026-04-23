import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PropertyForm from '../components/property/PropertyForm'
import { api } from '../lib/api'

const MAX_IMAGES = 6

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
  images: [],
  galleryImages: [],
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

function createGalleryItem({ id, url = '', previewUrl = '', file = null, source = 'url', isCover = false, uploadedAt = null }) {
  return {
    id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    url,
    previewUrl: previewUrl || url,
    file,
    source,
    isCover,
    uploadedAt
  }
}

function dedupeGallery(items = []) {
  const seen = new Set()
  return items.filter((item) => {
    const key = item.url || item.previewUrl || item.id
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildGalleryFromProperty(property) {
  const gallery = []
  const imageList = Array.isArray(property?.images)
    ? [...property.images].sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0))
    : []

  if (property?.image) {
    gallery.push(createGalleryItem({
      url: property.image,
      previewUrl: property.image,
      source: imageList[0]?.source || 'url',
      isCover: true,
      uploadedAt: imageList[0]?.uploadedAt || null
    }))
  }

  imageList.forEach((item) => {
    if (!item?.url) return
    gallery.push(createGalleryItem({
      url: item.url,
      previewUrl: item.url,
      source: item.source || 'url',
      isCover: Boolean(item.isCover),
      uploadedAt: item.uploadedAt || null
    }))
  })

  const deduped = dedupeGallery(gallery).slice(0, MAX_IMAGES)
  return deduped.map((item, index) => ({ ...item, isCover: index === 0 }))
}

function syncImageFields(previousForm, galleryImages) {
  const ordered = galleryImages.map((item, index) => ({ ...item, isCover: index === 0 }))
  return {
    ...previousForm,
    image: ordered[0]?.url || '',
    images: ordered.map((item, index) => ({
      url: item.url,
      sortOrder: index,
      isCover: index === 0,
      source: item.source || 'url',
      uploadedAt: item.uploadedAt || null
    })),
    galleryImages: ordered
  }
}

function mapPropertyToForm(property) {
  const galleryImages = buildGalleryFromProperty(property)
  return {
    title: property?.title || '',
    price: property?.price ?? '',
    description: property?.description || '',
    propertyType: property?.propertyType || 'Apartment',
    listingType: property?.listingType || 'rent',
    bedrooms: property?.bedrooms ?? '1',
    bathrooms: property?.bathrooms ?? '1',
    squareFeet: property?.squareFeet ?? '850',
    image: galleryImages[0]?.url || property?.image || '',
    images: galleryImages.map((item, index) => ({
      url: item.url,
      sortOrder: index,
      isCover: index === 0,
      source: item.source || 'url',
      uploadedAt: item.uploadedAt || null
    })),
    galleryImages,
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

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read the selected image file.'))
    reader.readAsDataURL(file)
  })
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

  const updateGallery = (updater) => {
    setForm((previous) => {
      const nextGallery = typeof updater === 'function' ? updater(previous.galleryImages || []) : updater
      return syncImageFields(previous, nextGallery.slice(0, MAX_IMAGES))
    })
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

  const handleCoverUrlChange = (value) => {
    updateGallery((previousGallery) => {
      const nextGallery = [...previousGallery]
      const trimmed = value.trim()

      if (!trimmed) {
        return nextGallery.slice(1)
      }

      const coverItem = createGalleryItem({
        id: nextGallery[0]?.id,
        url: trimmed,
        previewUrl: trimmed,
        file: null,
        source: 'url',
        isCover: true,
        uploadedAt: nextGallery[0]?.uploadedAt || null
      })

      if (nextGallery.length) {
        nextGallery[0] = coverItem
        return dedupeGallery(nextGallery)
      }

      return [coverItem]
    })
  }

  const handleFileSelection = (files, mode = 'gallery') => {
    const selectedFiles = Array.from(files || [])
    if (!selectedFiles.length) return

    setPageState((previous) => ({ ...previous, error: '' }))

    updateGallery((previousGallery) => {
      const nextGallery = [...previousGallery]
      const currentCount = nextGallery.length
      const availableSlots = MAX_IMAGES - currentCount

      if (availableSlots <= 0) {
        setPageState((previous) => ({ ...previous, error: `You can upload up to ${MAX_IMAGES} images only.` }))
        return previousGallery
      }

      const incomingItems = selectedFiles.slice(0, mode === 'cover' ? 1 : availableSlots).map((file) => createGalleryItem({
        file,
        previewUrl: URL.createObjectURL(file),
        source: 'local-file',
        isCover: false
      }))

      if (mode === 'cover') {
        if (nextGallery.length) {
          nextGallery[0] = incomingItems[0]
          return dedupeGallery(nextGallery)
        }

        return incomingItems
      }

      if (selectedFiles.length > availableSlots) {
        setPageState((previous) => ({ ...previous, error: `Only ${availableSlots} more image slot(s) are available.` }))
      }

      return dedupeGallery([...nextGallery, ...incomingItems]).slice(0, MAX_IMAGES)
    })
  }

  const handleRemoveImage = (imageId) => {
    updateGallery((previousGallery) => previousGallery.filter((item) => item.id !== imageId))
  }

  const handleMoveImage = (imageId, direction) => {
    updateGallery((previousGallery) => {
      const nextGallery = [...previousGallery]
      const currentIndex = nextGallery.findIndex((item) => item.id === imageId)
      if (currentIndex === -1) return previousGallery
      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= nextGallery.length) return previousGallery
      ;[nextGallery[currentIndex], nextGallery[targetIndex]] = [nextGallery[targetIndex], nextGallery[currentIndex]]
      return nextGallery
    })
  }

  const handleSetCover = (imageId) => {
    updateGallery((previousGallery) => {
      const currentIndex = previousGallery.findIndex((item) => item.id === imageId)
      if (currentIndex <= 0) return previousGallery
      const nextGallery = [...previousGallery]
      const [selected] = nextGallery.splice(currentIndex, 1)
      nextGallery.unshift(selected)
      return nextGallery
    })
  }

  const handleAddImageUrl = (value, mode = 'gallery') => {
    const trimmed = value.trim()
    if (!trimmed) return

    if (mode === 'cover') {
      handleCoverUrlChange(trimmed)
      return
    }

    updateGallery((previousGallery) => {
      if (previousGallery.length >= MAX_IMAGES) {
        setPageState((previous) => ({ ...previous, error: `You can upload up to ${MAX_IMAGES} images only.` }))
        return previousGallery
      }

      return dedupeGallery([...previousGallery, createGalleryItem({ url: trimmed, previewUrl: trimmed, source: 'url' })])
    })
  }

  const uploadLocalImages = async (galleryImages) => {
    const localImages = galleryImages.filter((item) => item.file)
    if (!localImages.length) return galleryImages

    const files = await Promise.all(localImages.map(async (item) => ({
      name: item.file.name,
      type: item.file.type,
      dataUrl: await fileToDataUrl(item.file)
    })))

    const { data } = await api.post('/uploads/property-images', { files })
    const uploadedFiles = Array.isArray(data.files) ? data.files : []
    let uploadIndex = 0

    return galleryImages.map((item) => {
      if (!item.file) return item
      const uploaded = uploadedFiles[uploadIndex]
      uploadIndex += 1
      return createGalleryItem({
        id: item.id,
        url: uploaded?.url || '',
        previewUrl: uploaded?.url || item.previewUrl,
        file: null,
        source: uploaded?.source || 'local-upload',
        isCover: item.isCover,
        uploadedAt: uploaded?.uploadedAt || null
      })
    })
  }

  const handleSubmit = async (action) => {
    try {
      setPageState((previous) => ({ ...previous, submitting: true, error: '' }))

      const uploadedGallery = await uploadLocalImages(form.galleryImages || [])
      const orderedGallery = uploadedGallery
        .filter((item) => item.url)
        .slice(0, MAX_IMAGES)
        .map((item, index) => ({
          url: item.url,
          sortOrder: index,
          isCover: index === 0,
          source: item.source || 'url',
          uploadedAt: item.uploadedAt || null
        }))

      const payload = {
        ...form,
        image: orderedGallery[0]?.url || '',
        images: orderedGallery,
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
              onCoverImageUrlChange={handleCoverUrlChange}
              onFilesSelected={handleFileSelection}
              onRemoveImage={handleRemoveImage}
              onMoveImage={handleMoveImage}
              onSetCover={handleSetCover}
              onAddImageUrl={handleAddImageUrl}
            />
          )}
        </div>
      </div>
    </>
  )
}
