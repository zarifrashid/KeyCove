import { useMemo, useState } from 'react'
import PropertyList from '../property/PropertyList'
import useFavorites from '../../hooks/useFavorites'

export default function SavedPropertiesSection() {
  const { favorites, loading, toggleFavorite } = useFavorites()
  const [busyId, setBusyId] = useState('')

  const savedProperties = useMemo(
    () => favorites.map((item) => item.property).filter(Boolean),
    [favorites]
  )

  const handleToggleFavorite = async (propertyId) => {
    try {
      setBusyId(propertyId)
      await toggleFavorite(propertyId)
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="card saved-properties-section">
      <div className="saved-properties-header">
        <div>
          <p className="badge">Bookmarks</p>
          <h2>Saved Properties</h2>
          <p>Properties you saved for later from Explore, Details, and Recommendations.</p>
        </div>
        <div className="saved-properties-count-pill">
          {loading ? 'Loading...' : `${savedProperties.length} saved`}
        </div>
      </div>

      {loading ? <p>Loading saved properties...</p> : null}

      {!loading && !savedProperties.length ? (
        <div className="empty-state compact-empty-state saved-properties-empty-state">
          <h3>No saved properties yet</h3>
          <p>Save a property from Explore Map, Property Details, or Recommendations and it will appear here.</p>
        </div>
      ) : null}

      {!loading && savedProperties.length ? (
        <PropertyList
          properties={savedProperties}
          selectedPropertyId=""
          onSelectProperty={() => {}}
          compact
          bookmarkBusyId={busyId}
          favoriteIds={new Set(savedProperties.map((property) => property._id))}
          onToggleFavorite={handleToggleFavorite}
          bookmarkSavedLabel="Saved"
        />
      ) : null}
    </section>
  )
}
