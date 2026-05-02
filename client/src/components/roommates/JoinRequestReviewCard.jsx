import { api } from '../../lib/api'

function formatMoney(value) {
  return value ? `৳ ${Number(value).toLocaleString()}` : 'Not provided'
}

export default function JoinRequestReviewCard({ request, onUpdated }) {
  const snapshot = request?.applicantSnapshot || {}

  const review = async (status) => {
    await api.patch(`/roommate-groups/join-requests/${request._id}/${status}`)
    onUpdated?.()
  }

  return (
    <article className="roommate-review-card">
      <div>
        <h4>{snapshot.name || request.applicant?.name || 'Applicant'}</h4>
        <p>{snapshot.occupation || 'Occupation not provided'} {snapshot.employmentStatus ? `- ${snapshot.employmentStatus}` : ''}</p>
      </div>
      <div className="request-profile-grid">
        <p><strong>Monthly Income:</strong> {formatMoney(snapshot.monthlyIncome)}</p>
        <p><strong>Expected Contribution:</strong> {formatMoney(request.expectedContribution)}</p>
        <p><strong>Phone:</strong> {snapshot.phone || 'Not provided'}</p>
        <p><strong>Email:</strong> {snapshot.email || 'Not provided'}</p>
        {request.introMessage ? <p className="request-profile-grid-full"><strong>Intro:</strong> {request.introMessage}</p> : null}
        {request.lifestyleNote ? <p className="request-profile-grid-full"><strong>Lifestyle:</strong> {request.lifestyleNote}</p> : null}
      </div>
      {request.status === 'pending' ? (
        <div className="request-action-row">
          <button type="button" className="primary-btn" onClick={() => review('accept')}>Accept</button>
          <button type="button" className="secondary-btn" onClick={() => review('reject')}>Reject</button>
        </div>
      ) : <span className={`manager-status-badge status-${request.status}`}>{request.status}</span>}
    </article>
  )
}
