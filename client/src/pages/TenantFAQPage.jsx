import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

const FAQ_CATEGORY_ORDER = [
  'Getting Started',
  'Explore Map & Search',
  'Property Details',
  'Bookmarks & Recently Viewed',
  'Recommendations',
  'Affordability & Mortgage Tools',
  'Messaging Managers',
  'Property Applications',
  'Lease Management',
  'Roommate Match',
  'Shared Search & Decision Hub',
  'Reports & Safety',
  'Notifications',
  'Account Help'
]

function getOrderedCategoryEntries(groups) {
  return Object.entries(groups).sort(([firstCategory], [secondCategory]) => {
    const firstIndex = FAQ_CATEGORY_ORDER.indexOf(firstCategory)
    const secondIndex = FAQ_CATEGORY_ORDER.indexOf(secondCategory)

    if (firstIndex === -1 && secondIndex === -1) return firstCategory.localeCompare(secondCategory)
    if (firstIndex === -1) return 1
    if (secondIndex === -1) return -1
    return firstIndex - secondIndex
  })
}

function groupFaqsByCategory(faqs) {
  return faqs.reduce((groups, faq) => {
    const category = faq.category || 'General'
    if (!groups[category]) groups[category] = []
    groups[category].push(faq)
    return groups
  }, {})
}

export default function TenantFAQPage() {
  const [faqs, setFaqs] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [openFaqId, setOpenFaqId] = useState('')
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [searchStatus, setSearchStatus] = useState({ loading: false, error: '', message: '' })

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setStatus({ loading: true, error: '' })
        const { data } = await api.get('/faqs/tenant')
        setFaqs(data.faqs || [])
        setStatus({ loading: false, error: '' })
      } catch (error) {
        setStatus({ loading: false, error: error.response?.data?.message || 'Failed to load tenant FAQs.' })
      }
    }

    loadFaqs()
  }, [])

  const groupedFaqs = useMemo(() => groupFaqsByCategory(faqs), [faqs])
  const groupedSearchResults = useMemo(() => groupFaqsByCategory(searchResults), [searchResults])
  const visibleGroups = submittedQuery ? groupedSearchResults : groupedFaqs
  const bestMatch = submittedQuery && searchResults.length ? searchResults[0] : null
  const suggestedArticles = submittedQuery ? searchResults.slice(bestMatch ? 1 : 0, bestMatch ? 5 : 4) : []

  const handleToggleFaq = (faqId) => {
    setOpenFaqId((current) => (current === faqId ? '' : faqId))
  }

  const handleSuggestedClick = (faq) => {
    setOpenFaqId(faq._id)
    setTimeout(() => {
      document.getElementById(`faq-${faq._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  const handleSearch = async (event) => {
    event?.preventDefault()
    const query = searchInput.trim()
    setSubmittedQuery(query)
    setOpenFaqId('')

    if (!query) {
      setSearchResults([])
      setSearchStatus({ loading: false, error: '', message: '' })
      return
    }

    try {
      setSearchStatus({ loading: true, error: '', message: '' })
      const { data } = await api.get('/faqs/tenant/search', { params: { q: query } })
      setSearchResults(data.results || [])
      setSearchStatus({ loading: false, error: '', message: data.message || '' })
    } catch (error) {
      setSearchResults([])
      setSearchStatus({ loading: false, error: error.response?.data?.message || 'Failed to search FAQs.', message: '' })
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSubmittedQuery('')
    setSearchResults([])
    setSearchStatus({ loading: false, error: '', message: '' })
    setOpenFaqId('')
  }

  return (
    <>
      <Navbar />
      <main className="faq-page">
        <section className="faq-hero">
          <p className="faq-eyebrow">Tenant Help Center</p>
          <h1>Hi, how can we help?</h1>
          <p>Explore common questions about finding, saving, applying for, and managing rental properties on KeyCove.</p>

          <form className="faq-search-form" onSubmit={handleSearch}>
            <div className="faq-search-input-wrap">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Ask about rent, messages, applications, leases, reports..."
                aria-label="Search tenant FAQs"
              />
              <span aria-hidden="true">⌕</span>
            </div>
            <button type="submit" className="primary-btn" disabled={searchStatus.loading}>
              {searchStatus.loading ? 'Searching...' : 'Search'}
            </button>
            {submittedQuery ? (
              <button type="button" className="secondary-btn" onClick={handleClearSearch}>
                Clear
              </button>
            ) : null}
          </form>
        </section>

        <section className="faq-content-wrap">
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {searchStatus.error ? <p className="error-text">{searchStatus.error}</p> : null}

          {submittedQuery ? (
            <section className="faq-ai-result card">
              <div className="faq-section-title-row">
                <div>
                  <p className="faq-eyebrow">Search Result</p>
                  <h2>AI-Generated Search Results</h2>
                </div>
                <span>{searchResults.length} match{searchResults.length === 1 ? '' : 'es'}</span>
              </div>

              {bestMatch ? (
                <article className="faq-best-answer">
                  <h3>{bestMatch.question}</h3>
                  <p>{bestMatch.answer}</p>
                  <small>Matched from KeyCove tenant help articles.</small>
                </article>
              ) : (
                <p className="faq-empty-message">
                  {searchStatus.message || "We couldn't find an exact answer. Try using simpler words like rent, message, application, lease, bookmark, recommendation, or report."}
                </p>
              )}

              {suggestedArticles.length ? (
                <div className="faq-suggested-articles">
                  <h3>Suggested Articles</h3>
                  <div className="faq-suggested-grid">
                    {suggestedArticles.map((faq) => (
                      <button key={faq._id} type="button" onClick={() => handleSuggestedClick(faq)}>
                        <span>{faq.category}</span>
                        <strong>{faq.question}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="faq-list-section">
            <div className="faq-section-heading">
              <p className="faq-eyebrow">Browse Help Topics</p>
              <h2>{submittedQuery ? `Results for “${submittedQuery}”` : 'Frequently Asked Questions'}</h2>
              <p>{submittedQuery ? 'Open a related article below for the full answer.' : 'Choose a tenant topic and open any question to view the answer.'}</p>
            </div>

            {status.loading ? (
              <div className="center-box">Loading tenant FAQs...</div>
            ) : Object.keys(visibleGroups).length ? (
              <div className="faq-category-grid">
                {getOrderedCategoryEntries(visibleGroups).map(([category, items]) => (
                  <article className="faq-category-card card" key={category}>
                    <h3>{category}</h3>
                    <div className="faq-accordion-list">
                      {items.map((faq) => {
                        const isOpen = openFaqId === faq._id
                        return (
                          <div className={`faq-accordion-item ${isOpen ? 'open' : ''}`} id={`faq-${faq._id}`} key={faq._id}>
                            <button
                              type="button"
                              className="faq-question-button"
                              onClick={() => handleToggleFaq(faq._id)}
                              aria-expanded={isOpen}
                            >
                              <span>{faq.question}</span>
                              <span aria-hidden="true">⌄</span>
                            </button>
                            {isOpen ? <p className="faq-answer">{faq.answer}</p> : null}
                          </div>
                        )
                      })}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <section className="faq-empty-card card">
                <h3>No FAQs found</h3>
                <p>{submittedQuery ? "We couldn't find an exact answer. Try using simpler words like rent, message, application, lease, bookmark, recommendation, or report." : 'Tenant FAQs have not been added yet. Run the FAQ seed script to add them to MongoDB.'}</p>
              </section>
            )}
          </section>
        </section>
      </main>
    </>
  )
}
