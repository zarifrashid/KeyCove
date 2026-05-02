import Faq from '../models/Faq.js'

const TENANT_FAQ_FILTER = { role: 'tenant', isActive: true }

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeText(value = '') {
  return String(value).toLowerCase().trim()
}

function getKeywordText(faq) {
  return Array.isArray(faq.keywords) ? faq.keywords.join(' ') : ''
}

function scoreFaq(faq, query) {
  const normalizedQuery = normalizeText(query)
  const terms = normalizedQuery.split(/\s+/).filter(Boolean)
  const question = normalizeText(faq.question)
  const answer = normalizeText(faq.answer)
  const category = normalizeText(faq.category)
  const keywords = normalizeText(getKeywordText(faq))

  let score = 0

  if (question.includes(normalizedQuery)) score += 80
  if (keywords.includes(normalizedQuery)) score += 55
  if (category.includes(normalizedQuery)) score += 35
  if (answer.includes(normalizedQuery)) score += 25

  terms.forEach((term) => {
    if (question.includes(term)) score += 12
    if (keywords.includes(term)) score += 10
    if (category.includes(term)) score += 6
    if (answer.includes(term)) score += 4
  })

  return score
}

function formatFaq(faq) {
  return {
    _id: faq._id,
    category: faq.category,
    question: faq.question,
    answer: faq.answer,
    keywords: faq.keywords || [],
    role: faq.role,
    isActive: faq.isActive,
    sortOrder: faq.sortOrder
  }
}

export async function getTenantFaqs(req, res) {
  try {
    const faqs = await Faq.find(TENANT_FAQ_FILTER)
      .sort({ category: 1, sortOrder: 1, question: 1 })
      .lean()

    return res.json({ faqs: faqs.map(formatFaq) })
  } catch (error) {
    console.error('Get tenant FAQs error:', error)
    return res.status(500).json({ message: 'Failed to load tenant FAQs.' })
  }
}

export async function searchTenantFaqs(req, res) {
  try {
    const query = String(req.query?.q || '').trim()

    if (!query) {
      return res.json({
        query,
        results: [],
        message: 'Type a question or keyword to search tenant FAQs.'
      })
    }

    const safeQuery = escapeRegex(query)
    const regex = new RegExp(safeQuery, 'i')

    const directMatches = await Faq.find({
      ...TENANT_FAQ_FILTER,
      $or: [
        { question: regex },
        { answer: regex },
        { category: regex },
        { keywords: regex }
      ]
    }).lean()

    let candidateFaqs = directMatches

    if (!candidateFaqs.length) {
      const terms = query
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length > 2)
        .slice(0, 8)

      if (terms.length) {
        const termConditions = terms.map((term) => {
          const termRegex = new RegExp(escapeRegex(term), 'i')
          return {
            $or: [
              { question: termRegex },
              { answer: termRegex },
              { category: termRegex },
              { keywords: termRegex }
            ]
          }
        })

        candidateFaqs = await Faq.find({
          ...TENANT_FAQ_FILTER,
          $or: termConditions
        }).lean()
      }
    }

    const results = candidateFaqs
      .map((faq) => ({ ...formatFaq(faq), score: scoreFaq(faq, query) }))
      .filter((faq) => faq.score > 0)
      .sort((first, second) => second.score - first.score || first.sortOrder - second.sortOrder)
      .slice(0, 8)

    return res.json({
      query,
      results,
      message: results.length
        ? 'Matched from KeyCove tenant help articles.'
        : "We couldn't find an exact answer. Try using simpler words like rent, message, application, lease, bookmark, recommendation, or report."
    })
  } catch (error) {
    console.error('Search tenant FAQs error:', error)
    return res.status(500).json({ message: 'Failed to search tenant FAQs.' })
  }
}
