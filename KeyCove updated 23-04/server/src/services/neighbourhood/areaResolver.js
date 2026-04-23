import { SUPPORTED_DHAKA_AREAS } from './supportedAreas.js'

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[.,/\-]/g, ' ')
    .replace(/\s+/g, ' ')
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
}

function editDistance(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

function fuzzyTokenMatch(tokens, aliasTokens) {
  if (!tokens.length || !aliasTokens.length) return false

  return aliasTokens.every((aliasToken) =>
    tokens.some((token) => {
      if (token === aliasToken) return true
      if (token.includes(aliasToken) || aliasToken.includes(token)) return true

      const maxDistance = aliasToken.length <= 5 ? 1 : 2
      return editDistance(token, aliasToken) <= maxDistance
    })
  )
}

export function isDhakaCity(city = '', address = '') {
  const normalizedCity = normalizeText(city)
  const normalizedAddress = normalizeText(address)

  if (normalizedAddress.includes('dhaka')) {
    return true
  }

  return (
    normalizedCity === 'dhaka' ||
    normalizedCity === 'dhaka city' ||
    normalizedCity === 'dhaka south' ||
    normalizedCity === 'dhaka north' ||
    normalizedCity === 'dhaka division' ||
    normalizedCity === 'dhaka district' ||
    normalizedCity.includes('dhaka')
  )
}

export function resolveSupportedDhakaArea(area, address = '') {
  const combinedText = normalizeText([area, address].filter(Boolean).join(' '))
  const combinedTokens = tokenize(combinedText)

  if (!combinedText) {
    return null
  }

  for (const [areaKey, aliases] of Object.entries(SUPPORTED_DHAKA_AREAS)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias)
      const aliasTokens = tokenize(alias)

      if (!normalizedAlias) continue

      if (
        combinedText === normalizedAlias ||
        combinedText.includes(normalizedAlias) ||
        normalizedAlias.includes(combinedText)
      ) {
        return areaKey
      }

      if (fuzzyTokenMatch(combinedTokens, aliasTokens)) {
        return areaKey
      }
    }
  }

  return null
}

export function resolveDhakaArea(city, area, address = '') {
  const areaKey = resolveSupportedDhakaArea(area, address)

  if (areaKey) {
    return {
      supported: true,
      reason: '',
      areaKey
    }
  }

  if (!isDhakaCity(city, address)) {
    return {
      supported: false,
      reason: 'Neighbourhood Insights are currently available only for Dhaka locations.',
      areaKey: null
    }
  }

  return {
    supported: false,
    reason: 'Neighbourhood Insights are currently available only for supported Dhaka areas.',
    areaKey: null
  }
}
