import { useMemo, useState } from 'react'

const PROPERTY_OPTIONS = ['Apartment', 'Condo', 'Studio', 'Family Home']
const LISTING_OPTIONS = [
  { value: 'rent', label: 'Rent' },
  { value: 'sale', label: 'Sale' }
]
const UTILITIES_OPTIONS = ['Owner is responsible', 'Tenant is responsible', 'Shared']
const PET_OPTIONS = ['Allowed', 'Not Allowed', 'Case by case']
const COMMON_AMENITIES = [
  'Lift',
  'Parking',
  '24/7 Security',
  'Generator Backup',
  'Gym Access',
  'Rooftop Garden',
  'Community Hall',
  'CCTV'
]

function Field({ label, children }) {
  return (
    <label className="property-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function PropertyForm({
  form,
  error,
  isSubmitting,
  isEdit,
  onChange,
  onNestedChange,
  onAmenityToggle,
  onAmenitiesInput,
  onSubmit,
  onCancel,
  onCoverImageUrlChange,
  onFilesSelected,
  onRemoveImage,
  onMoveImage,
  onSetCover,
  onAddImageUrl
}) {
  const amenitiesText = useMemo(() => form.amenities.join(', '), [form.amenities])
  const galleryImages = Array.isArray(form.galleryImages) ? form.galleryImages : []
  const coverPreview = galleryImages[0]?.previewUrl || galleryImages[0]?.url || ''
  const [manualGalleryUrl, setManualGalleryUrl] = useState('')

  return (
    <form
      className="property-form-shell"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit('publish')
      }}
    >
      <div className="property-form-header-row">
        <div>
          <p className="badge">Manager Only</p>
          <h1>{isEdit ? 'Update Property' : 'Add New Property'}</h1>
          <p className="property-form-subtext">
            Fill in the listing details below. Save a draft first, or publish when the property is ready to appear in Explore Map.
          </p>
        </div>
      </div>

      {error ? <p className="error-text property-form-error">{error}</p> : null}

      <div className="property-grid three-col">
        <Field label="Title">
          <input value={form.title} onChange={(event) => onChange('title', event.target.value)} placeholder="Enter property title" />
        </Field>
        <Field label="Price">
          <input type="number" min="0" value={form.price} onChange={(event) => onChange('price', event.target.value)} placeholder="Enter price" />
        </Field>
        <Field label="Address">
          <input
            value={form.location.address}
            onChange={(event) => onNestedChange('location', 'address', event.target.value)}
            placeholder="Enter address"
          />
        </Field>
      </div>

      <div className="property-description-wrap">
        <label className="property-field full-width">
          <span>Description</span>
          <div className="property-editor-shell">
            <textarea
              className="property-description-input"
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              placeholder="Write a clear property description"
            />
          </div>
        </label>
      </div>

      <div className="property-grid three-col">
        <Field label="City">
          <input value={form.location.city} onChange={(event) => onNestedChange('location', 'city', event.target.value)} placeholder="Dhaka" />
        </Field>
        <Field label="Bedroom Number">
          <input type="number" min="0" value={form.bedrooms} onChange={(event) => onChange('bedrooms', event.target.value)} placeholder="0" />
        </Field>
        <Field label="Bathroom Number">
          <input type="number" min="0" value={form.bathrooms} onChange={(event) => onChange('bathrooms', event.target.value)} placeholder="0" />
        </Field>
      </div>

      <div className="property-grid three-col">
        <Field label="Latitude">
          <input
            type="number"
            step="any"
            value={form.location.latitude}
            onChange={(event) => onNestedChange('location', 'latitude', event.target.value)}
            placeholder="23.8103"
          />
        </Field>
        <Field label="Longitude">
          <input
            type="number"
            step="any"
            value={form.location.longitude}
            onChange={(event) => onNestedChange('location', 'longitude', event.target.value)}
            placeholder="90.4125"
          />
        </Field>
        <Field label="Sale / Rent">
          <select value={form.listingType} onChange={(event) => onChange('listingType', event.target.value)}>
            {LISTING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="property-grid three-col">
        <Field label="Property Type">
          <select value={form.propertyType} onChange={(event) => onChange('propertyType', event.target.value)}>
            {PROPERTY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Utilities Policy">
          <select value={form.policies.utilities} onChange={(event) => onNestedChange('policies', 'utilities', event.target.value)}>
            {UTILITIES_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Pet Policy">
          <select value={form.policies.pet} onChange={(event) => onNestedChange('policies', 'pet', event.target.value)}>
            {PET_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="property-grid three-col">
        <Field label="Income Policy">
          <input
            value={form.policies.income}
            onChange={(event) => onNestedChange('policies', 'income', event.target.value)}
            placeholder="Income Policy"
          />
        </Field>
        <Field label="Total Size (sqft)">
          <input type="number" min="0" value={form.squareFeet} onChange={(event) => onChange('squareFeet', event.target.value)} placeholder="850" />
        </Field>
        <Field label="School">
          <input
            value={form.nearbyPlaces.school}
            onChange={(event) => onNestedChange('nearbyPlaces', 'school', event.target.value)}
            placeholder="Nearby school"
          />
        </Field>
      </div>

      <div className="property-grid three-col">
        <Field label="Bus">
          <input value={form.nearbyPlaces.bus} onChange={(event) => onNestedChange('nearbyPlaces', 'bus', event.target.value)} placeholder="Bus stop" />
        </Field>
        <Field label="Restaurant">
          <input
            value={form.nearbyPlaces.restaurant}
            onChange={(event) => onNestedChange('nearbyPlaces', 'restaurant', event.target.value)}
            placeholder="Restaurant"
          />
        </Field>
        <Field label="Area / Neighborhood">
          <input value={form.location.area} onChange={(event) => onNestedChange('location', 'area', event.target.value)} placeholder="Dhanmondi" />
        </Field>
      </div>

      <div className="property-grid two-col property-bottom-grid">
        <div className="property-side-panel">
          <div className="property-image-manager">
            <div className="property-image-manager-header">
              <div>
                <span className="property-image-title"> Upload Image </span>
                <p>Upto 6 images</p>
              </div>
              <span className="property-image-counter">{galleryImages.length}/6 images</span>
            </div>

            <div className="property-image-upload-grid">
              <label className="upload-panel-card">
                <strong>Cover Image</strong>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => onFilesSelected(event.target.files, 'cover')}
                />
              </label>

              <label className="upload-panel-card">
                <strong>Additional Images</strong>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => onFilesSelected(event.target.files, 'gallery')}
                />
              </label>
            </div>

            <Field label="Cover Image URL (fallback)">
              <input
                value={form.image}
                onChange={(event) => onCoverImageUrlChange(event.target.value)}
                placeholder="https://..."
              />
            </Field>

            <div className="property-inline-url-row">
              <input
                value={manualGalleryUrl}
                onChange={(event) => setManualGalleryUrl(event.target.value)}
                placeholder="Add an extra image URL"
              />
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  onAddImageUrl(manualGalleryUrl, 'gallery')
                  setManualGalleryUrl('')
                }}
              >
                Add URL
              </button>
            </div>

            <div className="property-gallery-grid">
              {galleryImages.length ? galleryImages.map((item, index) => (
                <article key={item.id} className={`property-gallery-card ${index === 0 ? 'cover-card' : ''}`}>
                  <div className="property-gallery-preview-wrap">
                    <img src={item.previewUrl || item.url} alt={`Property ${index + 1}`} className="property-gallery-preview" />
                    <div className="property-gallery-badges">
                      {index === 0 ? <span className="badge success-badge">Cover</span> : null}
                      <span className="badge neutral-badge">#{index + 1}</span>
                    </div>
                  </div>
                  <div className="property-gallery-meta">
                    <strong>{item.file?.name || item.url || `Image ${index + 1}`}</strong>
                    <small>{item.file ? 'Ready to upload on submit' : 'Stored URL'}</small>
                  </div>
                  <div className="property-gallery-actions">
                    <button type="button" className="secondary-btn compact-btn" onClick={() => onMoveImage(item.id, 'left')} disabled={index === 0}>←</button>
                    <button type="button" className="secondary-btn compact-btn" onClick={() => onMoveImage(item.id, 'right')} disabled={index === galleryImages.length - 1}>→</button>
                    <button type="button" className="secondary-btn compact-btn" onClick={() => onSetCover(item.id)} disabled={index === 0}>Set Cover</button>
                    <button type="button" className="danger-btn compact-btn" onClick={() => onRemoveImage(item.id)}>Remove</button>
                  </div>
                </article>
              )) : (
                <div className="property-preview-placeholder">Upload a cover image and up to 5 more gallery images. You can also add image URLs manually.</div>
              )}
            </div>
          </div>

          <Field label="Postal Code">
            <input
              value={form.location.postalCode}
              onChange={(event) => onNestedChange('location', 'postalCode', event.target.value)}
              placeholder="1205"
            />
          </Field>
          <Field label="Available From">
            <input
              type="date"
              value={form.availableFrom}
              onChange={(event) => onChange('availableFrom', event.target.value)}
            />
          </Field>
        </div>

        <div className="property-side-panel">
          <div className="property-field full-width">
            <span>Amenities</span>
            <div className="property-amenity-chips">
              {COMMON_AMENITIES.map((amenity) => {
                const active = form.amenities.includes(amenity)
                return (
                  <button
                    key={amenity}
                    type="button"
                    className={`amenity-pill ${active ? 'active' : ''}`}
                    onClick={() => onAmenityToggle(amenity)}
                  >
                    {amenity}
                  </button>
                )
              })}
            </div>
            <input
              value={amenitiesText}
              onChange={(event) => onAmenitiesInput(event.target.value)}
              placeholder="Comma separated amenities"
            />
          </div>

          <div className="property-preview-card">
            <span>Cover Preview</span>
            {coverPreview ? (
              <img src={coverPreview} alt="Property preview" className="property-preview-image" />
            ) : (
              <div className="property-preview-placeholder">Add an image URL or upload a photo to preview the property cover.</div>
            )}
          </div>
        </div>
      </div>

      <div className="property-form-actions">
        <button type="button" className="secondary-btn" disabled={isSubmitting} onClick={() => onSubmit('draft')}>
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button type="submit" className="primary-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : (isEdit ? 'Update & Publish' : 'Publish')}
        </button>
        <button type="button" className="ghost-action-btn" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
