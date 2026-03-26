import { DHAKA_AREA_PROFILES } from './dhakaAreaProfiles.js'

export const SUPPORTED_DHAKA_AREAS = Object.entries(DHAKA_AREA_PROFILES).reduce((accumulator, [areaKey, profile]) => {
  accumulator[areaKey] = profile.aliases
  return accumulator
}, {})
