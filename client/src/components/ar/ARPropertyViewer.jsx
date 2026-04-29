import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/api'

const DEFAULT_FURNITURE = [
  { furnitureId: 'sofa-3-seat', name: '3-seat Sofa', category: 'living', itemType: 'furniture', icon: '🛋️', color: '#264f73', dimensions: { width: 84, depth: 36, height: 34 }, clearance: { front: 30, side: 12 } },
  { furnitureId: 'sectional-sofa', name: 'Sectional Sofa', category: 'living', itemType: 'furniture', icon: '🛋️', color: '#1f5f63', dimensions: { width: 110, depth: 70, height: 34 }, clearance: { front: 36, side: 12 } },
  { furnitureId: 'tv-console', name: 'TV Console', category: 'living', itemType: 'furniture', icon: '▤', color: '#475569', dimensions: { width: 60, depth: 18, height: 24 }, clearance: { front: 24, side: 6 } },
  { furnitureId: 'queen-bed', name: 'Queen Bed', category: 'bedroom', itemType: 'furniture', icon: '🛏️', color: '#8a5a44', dimensions: { width: 76, depth: 80, height: 30 }, clearance: { front: 30, side: 24 } },
  { furnitureId: 'single-bed', name: 'Single Bed', category: 'bedroom', itemType: 'furniture', icon: '🛏️', color: '#926c4f', dimensions: { width: 42, depth: 78, height: 28 }, clearance: { front: 24, side: 18 } },
  { furnitureId: 'wardrobe', name: 'Wardrobe', category: 'bedroom', itemType: 'furniture', icon: '▥', color: '#725c45', dimensions: { width: 48, depth: 24, height: 78 }, clearance: { front: 30, side: 6 } },
  { furnitureId: 'study-table', name: 'Study Table', category: 'study', itemType: 'furniture', icon: '🖥️', color: '#455a64', dimensions: { width: 48, depth: 26, height: 30 }, clearance: { front: 30, side: 8 } },
  { furnitureId: 'dining-table-4', name: 'Dining Table 4p', category: 'dining', itemType: 'furniture', icon: '🍽️', color: '#2f6f4e', dimensions: { width: 60, depth: 36, height: 30 }, clearance: { front: 36, side: 30 } },
  { furnitureId: 'chair', name: 'Chair', category: 'general', itemType: 'furniture', icon: '🪑', color: '#6b7280', dimensions: { width: 22, depth: 22, height: 34 }, clearance: { front: 18, side: 6 } },
  { furnitureId: 'ceiling-fan', name: 'Ceiling Fan', category: 'fixture', itemType: 'fixture', icon: '🌀', color: '#64748b', dimensions: { width: 48, depth: 48, height: 10 }, clearance: { front: 0, side: 0 } },
  { furnitureId: 'light', name: 'Light', category: 'fixture', itemType: 'fixture', icon: '💡', color: '#f2b84b', dimensions: { width: 18, depth: 18, height: 10 }, clearance: { front: 0, side: 0 } },
  { furnitureId: 'plant', name: 'Plant', category: 'decor', itemType: 'decor', icon: '🪴', color: '#28724f', dimensions: { width: 22, depth: 22, height: 42 }, clearance: { front: 6, side: 6 } },
  { furnitureId: 'balcony-chair', name: 'Balcony Chair', category: 'balcony', itemType: 'furniture', icon: '☕', color: '#0f766e', dimensions: { width: 26, depth: 26, height: 34 }, clearance: { front: 18, side: 6 } }
]

const CATEGORY_LABELS = {
  living: 'Living',
  bedroom: 'Bedroom',
  dining: 'Dining',
  study: 'Study',
  fixture: 'Lights & Fixtures',
  decor: 'Decor',
  balcony: 'Balcony',
  general: 'General'
}

const ROOM_RATIO_PRESETS = [
  { type: 'living', share: 0.24, min: 150, max: 280, ratio: 1.35, name: 'Living Room' },
  { type: 'kitchen', share: 0.12, min: 80, max: 150, ratio: 1.15, name: 'Kitchen' },
  { type: 'bedroom', share: 0.16, min: 100, max: 175, ratio: 1.08, name: 'Bedroom' },
  { type: 'bathroom', share: 0.055, min: 36, max: 70, ratio: 1.25, name: 'Bathroom' },
  { type: 'balcony', share: 0.05, min: 35, max: 80, ratio: 2.1, name: 'Balcony' }
]

function slugify(value, fallback = 'item') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || fallback
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function round(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round(Number(value || 0) * factor) / factor
}

function inchesToFeet(value) {
  return Number(value || 0) / 12
}

function feetToInches(value) {
  return Number(value || 0) * 12
}

function areaToDimensions(area, ratio = 1.2) {
  const safeArea = Math.max(Number(area || 0), 20)
  const length = Math.sqrt(safeArea / ratio)
  const width = safeArea / length
  return { width: round(width, 1), length: round(length, 1) }
}

function roomArea(room) {
  return Number(room?.width || 0) * Number(room?.length || 0)
}

function buildDefaultRooms(property = {}) {
  const totalArea = Number(property?.squareFeet || 850)
  const bedroomCount = Math.max(1, Number(property?.bedrooms || 1))
  const bathroomCount = Math.max(1, Number(property?.bathrooms || 1))
  const rooms = []

  const livingPreset = ROOM_RATIO_PRESETS.find((preset) => preset.type === 'living')
  const kitchenPreset = ROOM_RATIO_PRESETS.find((preset) => preset.type === 'kitchen')
  const bedroomPreset = ROOM_RATIO_PRESETS.find((preset) => preset.type === 'bedroom')
  const bathroomPreset = ROOM_RATIO_PRESETS.find((preset) => preset.type === 'bathroom')
  const balconyPreset = ROOM_RATIO_PRESETS.find((preset) => preset.type === 'balcony')

  const makeRoom = (preset, index = 1, areaMultiplier = 1) => {
    const targetArea = clamp(totalArea * preset.share * areaMultiplier, preset.min, preset.max)
    const dimensions = areaToDimensions(targetArea, preset.ratio)
    const suffix = index > 1 ? ` ${index}` : ''
    return {
      roomId: `${preset.type}-${index}`.replace('-1', preset.type === 'living' || preset.type === 'kitchen' || preset.type === 'balcony' ? '' : '-1'),
      name: preset.type === 'living' || preset.type === 'kitchen' || preset.type === 'balcony' ? preset.name : `${preset.name} ${index}`,
      type: preset.type,
      width: dimensions.width,
      length: dimensions.length,
      hasBalcony: preset.type === 'balcony'
    }
  }

  rooms.push({ ...makeRoom(livingPreset), roomId: 'living-room' })
  rooms.push({ ...makeRoom(kitchenPreset), roomId: 'kitchen' })

  for (let index = 1; index <= bedroomCount; index += 1) {
    rooms.push(makeRoom(bedroomPreset, index, index === 1 ? 1.08 : 0.92))
  }

  for (let index = 1; index <= bathroomCount; index += 1) {
    rooms.push(makeRoom(bathroomPreset, index, 1))
  }

  rooms.push({ ...makeRoom(balconyPreset), roomId: 'balcony' })
  return rooms
}

function normalizeRoom(room, index) {
  const name = room?.name || `Room ${index + 1}`
  return {
    roomId: room?.roomId || slugify(name, `room-${index + 1}`),
    name,
    type: room?.type || 'room',
    width: clamp(Number(room?.width || 12), 4, 60),
    length: clamp(Number(room?.length || 12), 4, 60),
    hasBalcony: Boolean(room?.hasBalcony)
  }
}

function normalizeDimensions(dimensions = {}) {
  return {
    width: clamp(Number(dimensions.width || 42), 6, 240),
    depth: clamp(Number(dimensions.depth || dimensions.length || 30), 6, 240),
    height: clamp(Number(dimensions.height || 30), 1, 240)
  }
}

function normalizeClearance(item = {}) {
  const raw = item.clearance || {}
  if (item.itemType === 'fixture') return { front: 0, side: 0 }
  return {
    front: clamp(Number(raw.front ?? 24), 0, 60),
    side: clamp(Number(raw.side ?? 12), 0, 48)
  }
}

function makePlacement(item, roomId, index, room) {
  const dimensions = normalizeDimensions(item.dimensions)
  const size = getItemPercentSize({ dimensions, scale: { x: 1, y: 1 } }, room)
  const x = clamp(18 + (index % 4) * 12, size.width / 2 + 2, 100 - size.width / 2 - 2)
  const y = clamp(22 + (index % 3) * 14, size.depth / 2 + 2, 100 - size.depth / 2 - 2)

  return {
    furnitureId: `${item.furnitureId || slugify(item.name)}-${Date.now()}-${index}`,
    roomId,
    catalogId: item.furnitureId || slugify(item.name),
    name: item.name || 'Furniture',
    category: item.category || 'general',
    itemType: item.itemType || 'furniture',
    modelUrl: item.modelUrl || '',
    imageUrl: '',
    icon: item.icon || '▣',
    color: item.color || '#0f4c81',
    position: { x, y, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    dimensions,
    clearance: normalizeClearance(item)
  }
}

function getItemFeet(item) {
  const scaleX = Number(item?.scale?.x || 1)
  const scaleY = Number(item?.scale?.y || item?.scale?.x || 1)
  const dimensions = normalizeDimensions(item?.dimensions)
  return {
    width: inchesToFeet(dimensions.width) * scaleX,
    depth: inchesToFeet(dimensions.depth) * scaleY,
    height: inchesToFeet(dimensions.height)
  }
}

function getItemPercentSize(item, room) {
  const feet = getItemFeet(item)
  return {
    width: clamp((feet.width / Math.max(Number(room?.width || 1), 1)) * 100, 1.5, 96),
    depth: clamp((feet.depth / Math.max(Number(room?.length || 1), 1)) * 100, 1.5, 96)
  }
}

function getRotatedBoundsPercent(item, room) {
  const size = getItemPercentSize(item, room)
  const angle = Math.abs(Number(item?.rotation?.z || 0) % 180) * Math.PI / 180
  return {
    width: Math.abs(size.width * Math.cos(angle)) + Math.abs(size.depth * Math.sin(angle)),
    depth: Math.abs(size.width * Math.sin(angle)) + Math.abs(size.depth * Math.cos(angle))
  }
}

function getAabb(item, room, clearanceInches = 0) {
  const bounds = getRotatedBoundsPercent(item, room)
  const clearanceX = (inchesToFeet(clearanceInches) / Math.max(Number(room?.width || 1), 1)) * 100
  const clearanceY = (inchesToFeet(clearanceInches) / Math.max(Number(room?.length || 1), 1)) * 100
  const x = Number(item?.position?.x ?? 50)
  const y = Number(item?.position?.y ?? 50)
  return {
    left: x - bounds.width / 2 - clearanceX,
    right: x + bounds.width / 2 + clearanceX,
    top: y - bounds.depth / 2 - clearanceY,
    bottom: y + bounds.depth / 2 + clearanceY,
    width: bounds.width,
    depth: bounds.depth
  }
}

function aabbOverlap(first, second) {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
}

function placementFootprintArea(item) {
  const feet = getItemFeet(item)
  return feet.width * feet.depth
}

function placementComfortArea(item) {
  const clearance = normalizeClearance(item)
  const feet = getItemFeet(item)
  const width = feet.width + inchesToFeet(clearance.side * 2)
  const depth = feet.depth + inchesToFeet(clearance.front)
  return Math.max(width * depth, placementFootprintArea(item))
}

function analyzeRoom(room, roomPlacements) {
  const area = Math.max(roomArea(room), 1)
  const furnitureItems = roomPlacements.filter((item) => item.itemType !== 'fixture')
  const footprint = furnitureItems.reduce((sum, item) => sum + placementFootprintArea(item), 0)
  const comfort = furnitureItems.reduce((sum, item) => sum + placementComfortArea(item), 0)
  const blockedItems = []
  const overlappingItems = new Set()
  const oversizedItems = []

  furnitureItems.forEach((item, index) => {
    const bounds = getAabb(item, room)
    if (bounds.left < 0 || bounds.right > 100 || bounds.top < 0 || bounds.bottom > 100) {
      blockedItems.push(item.furnitureId)
    }

    const feet = getItemFeet(item)
    if (feet.width > Number(room.width) || feet.depth > Number(room.length)) {
      oversizedItems.push(item.furnitureId)
    }

    furnitureItems.slice(index + 1).forEach((other) => {
      if (aabbOverlap(getAabb(item, room, 4), getAabb(other, room, 4))) {
        overlappingItems.add(item.furnitureId)
        overlappingItems.add(other.furnitureId)
      }
    })
  })

  const comfortRatio = comfort / area
  const footprintRatio = footprint / area
  let label = 'Spacious'
  let tone = 'good'
  let advice = 'Plenty of open walking space remains.'

  if (oversizedItems.length || blockedItems.length || overlappingItems.size || comfortRatio > 1) {
    label = 'Needs adjustment'
    tone = 'bad'
    advice = 'At least one item is outside the room, overlapping, or needs more clearance than the room allows.'
  } else if (comfortRatio > 0.72) {
    label = 'Tight fit'
    tone = 'warn'
    advice = 'The furniture fits, but walkways may feel narrow.'
  } else if (comfortRatio > 0.52) {
    label = 'Good fit'
    tone = 'good'
    advice = 'The room is furnished but still practical.'
  }

  return {
    area,
    footprint,
    comfort,
    openArea: Math.max(area - comfort, 0),
    footprintPercent: Math.round(footprintRatio * 100),
    percent: Math.round(comfortRatio * 100),
    label,
    tone,
    advice,
    blockedItems,
    overlappingItems,
    oversizedItems
  }
}

function parseTypedDimensions(input) {
  const text = String(input || '').toLowerCase()
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)(?:\s*(?:x|×|by)\s*(\d+(?:\.\d+)?))?\s*(in|inch|inches|ft|feet|')?/) ||
    text.match(/(\d+(?:\.\d+)?)\s*(in|inch|inches|ft|feet|')?\s*(?:wide|w)\D+(\d+(?:\.\d+)?)\s*(in|inch|inches|ft|feet|')?\s*(?:deep|long|d|l)?/)
  if (!match) return null

  const first = Number(match[1])
  const second = Number(match[2]) || Number(match[3])
  const unit = match[4] || match[2]
  const multiplier = /ft|feet|'/.test(String(unit || '')) ? 12 : 1
  if (!first || !second) return null
  return { width: first * multiplier, depth: second * multiplier, height: 30 }
}

function cleanItemName(input) {
  return String(input || '')
    .replace(/\d+(?:\.\d+)?\s*(?:x|×|by)\s*\d+(?:\.\d+)?(?:\s*(?:x|×|by)\s*\d+(?:\.\d+)?)?\s*(?:in|inch|inches|ft|feet|')?/ig, '')
    .replace(/\b(inch|inches|feet|ft|wide|deep|long)\b/ig, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getManagerId(property = {}) {
  const manager = property?.manager
  if (!manager) return ''
  if (typeof manager === 'string') return manager
  return manager._id || manager.id || ''
}

function getUserId(user = {}) {
  return user?._id || user?.id || user?.userId || ''
}

function itemStatusClass(item, room, analysis) {
  if (analysis.blockedItems.includes(item.furnitureId) || analysis.oversizedItems.includes(item.furnitureId)) return 'invalid'
  if (analysis.overlappingItems.has(item.furnitureId)) return 'overlap'
  return ''
}

export default function ARPropertyViewer({ property, user, onClose }) {
  const roomRef = useRef(null)
  const [viewerState, setViewerState] = useState({ loading: true, saving: false, error: '', saved: '' })
  const [placements, setPlacements] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [logs, setLogs] = useState([])
  const [viewState, setViewState] = useState({ cameraMode: 'planner', zoom: 1, activeRoomId: 'living-room', lastSelectedFurnitureId: '' })
  const [catalogFilter, setCatalogFilter] = useState('all')
  const [customItemName, setCustomItemName] = useState('')
  const [layoutMeta, setLayoutMeta] = useState({ source: 'empty', canEditDefault: false })
  const [defaultPlacements, setDefaultPlacements] = useState([])

  const arAssets = property?.arAssets || {}
  const rawModelUrl = arAssets.propertyModelUrl || arAssets.floorPlanModelUrl || ''
  const displayModelUrl = /astronaut/i.test(rawModelUrl) ? '' : rawModelUrl
  const isManagerOwner = user?.role === 'manager' && getManagerId(property) === getUserId(user)

  const rooms = useMemo(() => {
    const configured = Array.isArray(arAssets.roomTemplates) ? arAssets.roomTemplates.filter((room) => room?.name) : []
    return (configured.length ? configured : buildDefaultRooms(property)).map(normalizeRoom)
  }, [arAssets.roomTemplates, property?.bedrooms, property?.bathrooms, property?.squareFeet])

  const activeRoom = rooms.find((room) => room.roomId === viewState.activeRoomId) || rooms[0]
  const activeRoomId = activeRoom?.roomId || 'living-room'

  const furnitureCatalog = useMemo(() => {
    const stored = Array.isArray(arAssets.furnitureCatalog)
      ? arAssets.furnitureCatalog
        .filter((item) => item?.name && !/^https?:\/\//i.test(String(item.name).trim()))
        .map((item) => ({ ...item, icon: item.icon || '▣', imageUrl: '', thumbnailUrl: '', itemType: item.itemType || 'furniture', dimensions: normalizeDimensions(item.dimensions), clearance: normalizeClearance(item) }))
      : []
    return stored.length ? stored : DEFAULT_FURNITURE
  }, [arAssets.furnitureCatalog])

  const catalogCategories = useMemo(() => ['all', ...new Set(furnitureCatalog.map((item) => item.category || 'general'))], [furnitureCatalog])
  const filteredCatalog = catalogFilter === 'all' ? furnitureCatalog : furnitureCatalog.filter((item) => (item.category || 'general') === catalogFilter)
  const roomPlacements = placements.filter((item) => (item.roomId || 'living-room') === activeRoomId)
  const selectedPlacement = placements.find((item) => item.furnitureId === selectedId) || null
  const roomAnalysis = analyzeRoom(activeRoom, roomPlacements)

  useEffect(() => {
    if (customElements.get('model-viewer')) return
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    const loadSession = async () => {
      if (!property?._id) return

      try {
        setViewerState({ loading: true, saving: false, error: '', saved: '' })
        const { data } = await api.get(`/ar-session/${property._id}`)
        const session = data.session
        const savedPlacements = Array.isArray(session?.furniturePlacements) ? session.furniturePlacements.map((item) => ({ ...item, dimensions: normalizeDimensions(item.dimensions), clearance: normalizeClearance(item) })) : []
        const managerPlacements = Array.isArray(data.defaultSession?.furniturePlacements) ? data.defaultSession.furniturePlacements.map((item) => ({ ...item, dimensions: normalizeDimensions(item.dimensions), clearance: normalizeClearance(item) })) : []
        const nextActiveRoom = session?.viewState?.activeRoomId || rooms[0]?.roomId || 'living-room'
        setDefaultPlacements(managerPlacements)
        setLayoutMeta({ source: data.source || 'empty', canEditDefault: Boolean(data.canEditDefault) })
        setPlacements(savedPlacements)
        setSelectedId(session?.viewState?.lastSelectedFurnitureId || savedPlacements[0]?.furnitureId || '')
        setViewState(session?.viewState || { cameraMode: 'planner', zoom: 1, activeRoomId: nextActiveRoom, lastSelectedFurnitureId: '' })
        setLogs([{ type: 'load', metadata: { propertyId: property._id, source: data.source || 'empty' }, createdAt: new Date().toISOString() }])
        setViewerState({ loading: false, saving: false, error: '', saved: '' })
      } catch (error) {
        setViewerState({ loading: false, saving: false, error: error.response?.data?.message || '', saved: '' })
        setLayoutMeta({ source: 'empty', canEditDefault: false })
        setDefaultPlacements([])
        setLogs([{ type: 'open', metadata: { propertyId: property._id, fallback: true }, createdAt: new Date().toISOString() }])
      }
    }

    loadSession()
  }, [property?._id, rooms])

  const addLog = (type, metadata = {}) => {
    setLogs((previous) => [...previous, { type, metadata, createdAt: new Date().toISOString() }].slice(-60))
  }

  const switchRoom = (roomId) => {
    setViewState((previous) => ({ ...previous, activeRoomId: roomId }))
    const firstInRoom = placements.find((item) => item.roomId === roomId)
    setSelectedId(firstInRoom?.furnitureId || '')
    addLog('room-switch', { roomId })
  }

  const handleAddFurniture = (item) => {
    const next = makePlacement(item, activeRoomId, placements.length, activeRoom)
    setPlacements((previous) => [...previous, next])
    setSelectedId(next.furnitureId)
    setViewState((previous) => ({ ...previous, activeRoomId, lastSelectedFurnitureId: next.furnitureId }))
    addLog('add-furniture', { furnitureId: next.furnitureId, name: next.name, roomId: activeRoomId })
  }

  const updateSelected = (updater, logType) => {
    if (!selectedId) return
    setPlacements((previous) => previous.map((item) => {
      if (item.furnitureId !== selectedId) return item
      return typeof updater === 'function' ? updater(item) : { ...item, ...updater }
    }))
    if (logType) addLog(logType, { furnitureId: selectedId, roomId: activeRoomId })
  }

  const handlePointerDown = (event, item) => {
    event.preventDefault()
    setSelectedId(item.furnitureId)
    setViewState((previous) => ({ ...previous, activeRoomId, lastSelectedFurnitureId: item.furnitureId }))

    const room = roomRef.current
    if (!room) return
    const rect = room.getBoundingClientRect()
    const bounds = getRotatedBoundsPercent(item, activeRoom)

    const move = (moveEvent) => {
      const x = clamp(((moveEvent.clientX - rect.left) / rect.width) * 100, bounds.width / 2, 100 - bounds.width / 2)
      const y = clamp(((moveEvent.clientY - rect.top) / rect.height) * 100, bounds.depth / 2, 100 - bounds.depth / 2)
      setPlacements((previous) => previous.map((placement) => (
        placement.furnitureId === item.furnitureId
          ? { ...placement, position: { ...placement.position, x, y } }
          : placement
      )))
    }

    const stop = () => {
      addLog('move', { furnitureId: item.furnitureId, roomId: activeRoomId })
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  const handleResetRoom = () => {
    setPlacements((previous) => previous.filter((item) => item.roomId !== activeRoomId))
    setSelectedId('')
    addLog('reset', { propertyId: property._id, roomId: activeRoomId })
  }

  const handleDuplicate = () => {
    if (!selectedPlacement) return
    const copy = {
      ...selectedPlacement,
      furnitureId: `${selectedPlacement.catalogId || selectedPlacement.furnitureId}-copy-${Date.now()}`,
      position: {
        ...selectedPlacement.position,
        x: clamp((selectedPlacement.position?.x || 50) + 6, 5, 95),
        y: clamp((selectedPlacement.position?.y || 50) + 6, 5, 95)
      }
    }
    setPlacements((previous) => [...previous, copy])
    setSelectedId(copy.furnitureId)
    addLog('duplicate', { furnitureId: selectedPlacement.furnitureId, copyId: copy.furnitureId })
  }

  const handleDeleteSelected = () => {
    if (!selectedId) return
    setPlacements((previous) => previous.filter((item) => item.furnitureId !== selectedId))
    addLog('delete', { furnitureId: selectedId })
    setSelectedId('')
  }

  const handleFullscreen = async () => {
    const target = roomRef.current?.closest('.ar-viewer-shell') || roomRef.current
    if (!target) return
    if (!document.fullscreenElement) {
      await target.requestFullscreen?.()
      addLog('fullscreen', { state: 'entered' })
    } else {
      await document.exitFullscreen?.()
      addLog('fullscreen', { state: 'exited' })
    }
  }

  const handleResetToManagerLayout = () => {
    if (!defaultPlacements.length) return
    setPlacements(defaultPlacements)
    setSelectedId(defaultPlacements[0]?.furnitureId || '')
    setViewState((previous) => ({
      ...previous,
      activeRoomId: defaultPlacements[0]?.roomId || previous.activeRoomId,
      lastSelectedFurnitureId: defaultPlacements[0]?.furnitureId || ''
    }))
    setLayoutMeta((previous) => ({ ...previous, source: 'property_default' }))
    addLog('reset-to-default', { propertyId: property._id })
  }

  const handleSave = async () => {
    try {
      setViewerState((previous) => ({ ...previous, saving: true, error: '', saved: '' }))
      const scope = isManagerOwner ? 'property_default' : 'user_custom'
      const { data } = await api.post('/ar-session', {
        propertyId: property._id,
        scope,
        furniturePlacements: placements,
        interactionLogs: [...logs, { type: 'save', metadata: { count: placements.length, scope }, createdAt: new Date().toISOString() }],
        viewState: { ...viewState, activeRoomId, lastSelectedFurnitureId: selectedId },
        savedName: isManagerOwner ? `${property.title || 'Property'} furnished layout` : `${property.title || 'Property'} personal room design`
      })
      setLogs([])
      setLayoutMeta((previous) => ({ ...previous, source: data.scope || previous.source }))
      if (data.scope === 'property_default') setDefaultPlacements(placements)
      setViewerState({ loading: false, saving: false, error: '', saved: data.message || 'Room design saved.' })
    } catch (error) {
      setViewerState({ loading: false, saving: false, error: error.response?.data?.message || 'Failed to save room design.', saved: '' })
    }
  }

  const buildTypedFurniture = (name) => {
    const rawName = name.trim()
    if (!rawName) return null
    const parsedDimensions = parseTypedDimensions(rawName)
    const cleanName = cleanItemName(rawName) || rawName
    const normalized = cleanName.toLowerCase()
    const matched = DEFAULT_FURNITURE.find((item) => normalized.includes(item.name.toLowerCase().split(' ')[0]) || item.name.toLowerCase().includes(normalized) || normalized.includes(item.furnitureId.split('-')[0]))
    const base = matched || {
      furnitureId: slugify(cleanName, 'custom-item'),
      name: cleanName,
      category: normalized.includes('fan') || normalized.includes('light') ? 'fixture' : 'general',
      itemType: normalized.includes('fan') || normalized.includes('light') ? 'fixture' : 'furniture',
      icon: normalized.includes('fan') ? '🌀' : normalized.includes('light') ? '💡' : cleanName[0]?.toUpperCase() || '▣',
      color: '#0f4c81',
      dimensions: { width: 42, depth: 30, height: 30 },
      clearance: { front: 18, side: 8 }
    }

    return {
      ...base,
      name: cleanName.toLowerCase() === base.name.toLowerCase() ? base.name : cleanName,
      dimensions: parsedDimensions ? normalizeDimensions({ ...base.dimensions, ...parsedDimensions }) : normalizeDimensions(base.dimensions),
      clearance: normalizeClearance(base)
    }
  }

  const handleAddTypedItem = () => {
    const item = buildTypedFurniture(customItemName)
    if (!item) return
    handleAddFurniture(item)
    setCustomItemName('')
  }

  const updateDimension = (field, value) => {
    const numeric = clamp(Number(value || 0), field === 'height' ? 1 : 6, 240)
    updateSelected((item) => ({ ...item, dimensions: { ...normalizeDimensions(item.dimensions), [field]: numeric } }), 'scale')
  }

  const selectedFeet = selectedPlacement ? getItemFeet(selectedPlacement) : null
  const selectedStatus = selectedPlacement ? itemStatusClass(selectedPlacement, activeRoom, roomAnalysis) : ''
  const selectedClearance = selectedPlacement ? normalizeClearance(selectedPlacement) : null

  return (
    <section className="card property-section-card ar-viewer-shell" id="room-designer">
      <div className="property-section-heading ar-heading-row">
        <div>
          <p className="badge">Interactive Room Designer</p>
          <h2>Design the Space Before Visiting</h2>
          <p>{isManagerOwner ? 'Create the furnished layout tenants will see for this listing.' : 'Check whether furniture actually fits, compare rooms, and save your own layout.'}</p>
        </div>
        <button type="button" className="ghost-action-btn" onClick={onClose}>Close Designer</button>
      </div>

      {viewerState.loading ? <p className="muted-text">Loading saved room design...</p> : null}
      {viewerState.error ? <p className="error-text">{viewerState.error}</p> : null}
      {viewerState.saved ? <p className="success-text">{viewerState.saved}</p> : null}

      <div className="designer-mode-card">
        <div>
          <strong>{isManagerOwner ? 'Manager staging mode' : layoutMeta.source === 'user_custom' ? 'Your saved design' : layoutMeta.source === 'property_default' ? 'Manager furnished layout' : 'Blank room planner'}</strong>
          <p>
            {isManagerOwner
              ? 'Save a realistic furnished plan once. Tenants will see it first and can make their own private copy.'
              : layoutMeta.source === 'property_default'
                ? 'You are viewing the manager’s furnished layout. Edit it and save your own private version.'
                : layoutMeta.source === 'user_custom'
                  ? 'This is your private version for this listing.'
                  : 'No saved layout exists yet. Start placing items to test the room.'}
          </p>
        </div>
        {!isManagerOwner && defaultPlacements.length ? (
          <button type="button" className="secondary-btn compact-btn" onClick={handleResetToManagerLayout}>Reset to Manager Layout</button>
        ) : null}
      </div>

      <div className="ar-room-tabs" role="tablist" aria-label="Rooms">
        {rooms.map((room) => {
          const items = placements.filter((item) => item.roomId === room.roomId)
          const analysis = analyzeRoom(room, items)
          return (
            <button
              type="button"
              key={room.roomId}
              className={`ar-room-tab ${activeRoomId === room.roomId ? 'active' : ''}`}
              onClick={() => switchRoom(room.roomId)}
            >
              <span>{room.name}</span>
              <small>{room.width} × {room.length} ft · {Math.round(roomArea(room))} sqft</small>
              <em className={`mini-room-status ${analysis.tone}`}>{analysis.label}</em>
            </button>
          )
        })}
      </div>

      <div className="ar-viewer-grid wow-room-designer-grid">
        <div className="ar-stage-card wow-stage-card">
          <div className="ar-stage-topbar">
            <div>
              <h3>{activeRoom?.name || 'Room'} Layout</h3>
              <p>{activeRoom?.width} ft × {activeRoom?.length} ft · {Math.round(roomAnalysis.area)} sqft · {roomPlacements.length} placed item{roomPlacements.length === 1 ? '' : 's'}</p>
            </div>
            <div className={`ar-fit-score ${roomAnalysis.tone}`}>
              <span>{roomAnalysis.label}</span>
              <strong>{roomAnalysis.percent}% comfort load</strong>
            </div>
          </div>

          <div className="realism-insight-card">
            <strong>Fit logic</strong>
            <p>{roomAnalysis.advice}</p>
            <div>
              <span>Furniture footprint: {round(roomAnalysis.footprint)} sqft</span>
              <span>With walking clearance: {round(roomAnalysis.comfort)} sqft</span>
              <span>Open usable area: {round(roomAnalysis.openArea)} sqft</span>
            </div>
          </div>

          <div
            className={`ar-room-plan wow-room-plan room-${activeRoom?.type || 'room'}`}
            ref={roomRef}
            aria-label={`${activeRoom?.name || 'Room'} layout planner`}
            style={{ aspectRatio: `${activeRoom?.width || 12} / ${activeRoom?.length || 12}` }}
          >
            <div className="ar-room-label">1 grid square ≈ 1 ft</div>
            <div className="ar-door-marker">Door</div>
            <div className="ar-window-marker">Window</div>
            {activeRoom?.type === 'balcony' || activeRoom?.hasBalcony ? <div className="ar-balcony-rail">Balcony rail</div> : null}

            {roomPlacements.map((item) => {
              const size = getItemPercentSize(item, activeRoom)
              const statusClass = itemStatusClass(item, activeRoom, roomAnalysis)
              return (
                <button
                  type="button"
                  key={item.furnitureId}
                  className={`ar-furniture-item wow-furniture-item ${selectedId === item.furnitureId ? 'selected' : ''} ${statusClass}`}
                  style={{
                    left: `${item.position?.x ?? 45}%`,
                    top: `${item.position?.y ?? 45}%`,
                    width: `${size.width}%`,
                    height: `${size.depth}%`,
                    transform: `translate(-50%, -50%) rotate(${item.rotation?.z || 0}deg)`,
                    background: item.color || '#0f4c81'
                  }}
                  onPointerDown={(event) => handlePointerDown(event, item)}
                  title={`${item.name}. ${round(getItemFeet(item).width, 1)} × ${round(getItemFeet(item).depth, 1)} ft. Drag to move.`}
                >
                  <span className="ar-item-icon">{item.icon || '▣'}</span>
                  <span className="ar-item-name">{item.name}</span>
                </button>
              )
            })}
          </div>

          <div className="ar-room-summary-grid real-summary-grid">
            <article><span>Room size</span><strong>{Math.round(roomAnalysis.area)} sqft</strong></article>
            <article><span>Actual footprint</span><strong>{roomAnalysis.footprintPercent}%</strong></article>
            <article><span>Comfort load</span><strong>{roomAnalysis.percent}%</strong></article>
            <article><span>Warnings</span><strong>{roomAnalysis.blockedItems.length + roomAnalysis.overlappingItems.size + roomAnalysis.oversizedItems.length}</strong></article>
          </div>

          {displayModelUrl ? (
            <details className="ar-optional-model-card">
              <summary>Open optional 3D property model</summary>
              <p>This appears only when a real room/apartment GLB model is attached. The room designer works without it.</p>
              <model-viewer
                className="ar-model-viewer compact-model-viewer"
                src={displayModelUrl}
                ios-src={displayModelUrl}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                touch-action="pan-y"
                shadow-intensity="1"
                alt={`3D model for ${property.title}`}
              >
                <button slot="ar-button" className="primary-btn ar-slot-button">Open 3D</button>
              </model-viewer>
            </details>
          ) : null}
        </div>

        <aside className="ar-control-panel wow-control-panel">
          <div className="ar-control-group planner-help-card">
            <h3>Will it fit?</h3>
            <p>Type exact dimensions like <strong>bed 76x80</strong> or <strong>sofa 84x36</strong>. Dimensions are inches. The planner converts them to feet and checks room space, walking clearance, and overlap.</p>
          </div>

          <div className="ar-control-group">
            <h3>Furniture & Fixtures</h3>
            <div className="ar-catalog-filters">
              {catalogCategories.map((category) => (
                <button key={category} type="button" className={catalogFilter === category ? 'active' : ''} onClick={() => setCatalogFilter(category)}>
                  {category === 'all' ? 'All' : CATEGORY_LABELS[category] || category}
                </button>
              ))}
            </div>
            <div className="ar-furniture-catalog wow-furniture-catalog">
              {filteredCatalog.map((item) => (
                <button key={item.furnitureId || item.name} type="button" className="ar-catalog-card realistic-catalog-card" onClick={() => handleAddFurniture(item)}>
                  <span className="ar-catalog-preview" style={{ background: item.color || '#0f4c81' }}>
                    {item.icon || '▣'}
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{normalizeDimensions(item.dimensions).width} × {normalizeDimensions(item.dimensions).depth} in · {CATEGORY_LABELS[item.category] || item.category || 'General'}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="ar-control-group custom-furniture-box">
            <h3>Type Any Item</h3>
            <p className="muted-text">Examples: queen bed 76x80, sofa 84x36, dining table 60x36, fan, light.</p>
            <div className="typed-item-row">
              <input
                value={customItemName}
                onChange={(event) => setCustomItemName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleAddTypedItem()
                }}
                placeholder="bed 76x80"
              />
              <button type="button" className="secondary-btn" onClick={handleAddTypedItem}>Place</button>
            </div>
          </div>

          <div className="ar-control-group selected-item-box">
            <h3>Selected Item</h3>
            {selectedPlacement ? (
              <>
                <div className={`selected-item-title ${selectedStatus}`}>
                  <span>{selectedPlacement.icon || '▣'}</span>
                  <div>
                    <strong>{selectedPlacement.name}</strong>
                    <small>{round(selectedFeet.width, 1)} × {round(selectedFeet.depth, 1)} ft · {selectedPlacement.dimensions?.width || 0} × {selectedPlacement.dimensions?.depth || 0} in</small>
                  </div>
                </div>
                {selectedStatus ? <p className="item-warning-text">{selectedStatus === 'invalid' ? 'This item does not fit cleanly in the room. Resize, rotate, or move it.' : 'This item overlaps another item. Move it to keep the layout realistic.'}</p> : <p className="success-text compact-success">Fits inside this room.</p>}
                <div className="dimension-input-grid">
                  <label><span>Width (in)</span><input type="number" min="6" max="240" value={selectedPlacement.dimensions?.width || 0} onChange={(event) => updateDimension('width', event.target.value)} /></label>
                  <label><span>Depth (in)</span><input type="number" min="6" max="240" value={selectedPlacement.dimensions?.depth || 0} onChange={(event) => updateDimension('depth', event.target.value)} /></label>
                </div>
                <p className="clearance-note">Recommended clearance: {selectedClearance.side} in sides, {selectedClearance.front} in front.</p>
                <label className="ar-slider-field">
                  <span>Rotate</span>
                  <input type="range" min="0" max="360" value={selectedPlacement.rotation?.z || 0} onChange={(event) => updateSelected((item) => ({ ...item, rotation: { ...item.rotation, z: Number(event.target.value) } }), 'rotate')} />
                </label>
                <label className="ar-slider-field">
                  <span>Scale</span>
                  <input type="range" min="0.5" max="2" step="0.05" value={selectedPlacement.scale?.x || 1} onChange={(event) => {
                    const scale = Number(event.target.value)
                    updateSelected((item) => ({ ...item, scale: { x: scale, y: scale, z: scale } }), 'scale')
                  }} />
                </label>
                <div className="selected-item-actions">
                  <button type="button" className="secondary-btn compact-btn" onClick={handleDuplicate}>Duplicate</button>
                  <button type="button" className="danger-btn compact-btn" onClick={handleDeleteSelected}>Remove</button>
                </div>
              </>
            ) : <p className="muted-text">Add or select an item to check real size, rotate, resize, duplicate, or remove it.</p>}
          </div>

          <div className="ar-control-actions">
            <button type="button" className="secondary-btn" onClick={handleResetRoom}>Reset This Room</button>
            <button type="button" className="secondary-btn" onClick={handleFullscreen}>View Full Screen</button>
            <button type="button" className="primary-btn" onClick={handleSave} disabled={viewerState.saving || !user}>{viewerState.saving ? 'Saving...' : isManagerOwner ? 'Save as Tenant View' : 'Save My Design'}</button>
          </div>
        </aside>
      </div>
    </section>
  )
}
