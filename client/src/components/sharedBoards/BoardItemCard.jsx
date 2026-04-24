import { useState } from 'react'
import { Link } from 'react-router-dom'
import BoardItemMiniMap from './BoardItemMiniMap'

function formatCurrency(value, listingType) {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return listingType === 'rent' ? `${amount} / month` : amount
}

export default function BoardItemCard({ item, onVote, onComment, onRemove, busy }) {
  const [commentText, setCommentText] = useState('')
  const property = item.property

  const submitComment = async (event) => {
    event.preventDefault()
    if (!commentText.trim()) return
    await onComment(item._id, commentText.trim())
    setCommentText('')
  }

  return (
    <article className="card shared-board-item-card">
      <div className="shared-board-item-media">
        <img src={property?.image} alt={property?.imageAlt || property?.title} className="shared-board-item-image" />
        <BoardItemMiniMap property={property} />
      </div>

      <div className="shared-board-item-content">
        <div className="shared-board-item-top">
          <div>
            <div className="property-badge-row">
              <span className="badge">{property?.propertyType}</span>
              <span className="badge listing-badge">{property?.listingType === 'sale' ? 'Sale' : 'Rent'}</span>
            </div>
            <h3>{property?.title}</h3>
            <p className="details-price compact">{formatCurrency(property?.price, property?.listingType)}</p>
            <p className="shared-board-inline-copy">{property?.location?.address}, {property?.location?.area}, {property?.location?.city}</p>
          </div>
          <button type="button" className="secondary-btn" onClick={() => onRemove(item._id)} disabled={busy}>Remove</button>
        </div>

        <div className="shared-board-item-facts">
          <span>{property?.bedrooms} beds</span>
          <span>{property?.bathrooms} baths</span>
          <span>{property?.squareFeet} sqft</span>
          <span>Added by {item.addedBy?.name || 'Member'}</span>
        </div>

        {item.note ? <p className="shared-board-item-note">Board note: {item.note}</p> : null}

        <div className="shared-board-item-actions">
          <Link to={`/properties/${property?._id}`} className="primary-btn">View Property</Link>
          <a
            className="secondary-btn"
            href={`https://www.openstreetmap.org/?mlat=${property?.location?.latitude}&mlon=${property?.location?.longitude}#map=16/${property?.location?.latitude}/${property?.location?.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Map
          </a>
          <button type="button" className={`secondary-btn ${item.votes?.viewerVote === 'upvote' ? 'is-active-vote' : ''}`} onClick={() => onVote(item._id, 'upvote')} disabled={busy}>▲ {item.votes?.upvoteCount || 0}</button>
          <button type="button" className={`secondary-btn ${item.votes?.viewerVote === 'downvote' ? 'is-active-vote downvote' : ''}`} onClick={() => onVote(item._id, 'downvote')} disabled={busy}>▼ {item.votes?.downvoteCount || 0}</button>
          <span className="shared-board-score">Score {item.votes?.score || 0}</span>
        </div>

        <section className="shared-board-comments-section">
          <h4>Comments</h4>
          <div className="shared-board-comment-list">
            {item.comments?.map((comment) => (
              <article key={comment._id} className="shared-board-comment-card">
                <strong>{comment.user?.name || 'Member'}</strong>
                <p>{comment.text}</p>
              </article>
            ))}
            {!item.comments?.length ? <p className="muted-text">No comments yet. Start the group discussion here.</p> : null}
          </div>
          <form className="shared-board-comment-form" onSubmit={submitComment}>
            <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment for your group" />
            <button type="submit" className="primary-btn" disabled={busy || !commentText.trim()}>Comment</button>
          </form>
        </section>
      </div>
    </article>
  )
}
