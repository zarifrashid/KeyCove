export const dhakaAreas = [
  {
    area: 'Dhanmondi',
    center: [23.7465, 90.3760],
    addresses: ['Road 3', 'Road 5', 'Road 7/A', 'Road 9', 'Lake Circus Link Road']
  },
  {
    area: 'Gulshan',
    center: [23.7925, 90.4078],
    addresses: ['Gulshan Avenue', 'Road 54', 'Road 62', 'Road 79', 'Gulshan Link Road']
  },
  {
    area: 'Banani',
    center: [23.7937, 90.4066],
    addresses: ['Road 11', 'Road 17', 'Road 27', 'Kamal Ataturk Avenue', 'Chairman Bari Road']
  },
  {
    area: 'Uttara',
    center: [23.8759, 90.3795],
    addresses: ['Sector 3 Road 5', 'Sector 4 Road 12', 'Sector 7 Lake Drive', 'Sector 11 Sonargaon Janapath', 'Sector 13 Road 2']
  },
  {
    area: 'Mirpur',
    center: [23.8067, 90.3686],
    addresses: ['Mirpur 10 Circle', 'Mirpur 11 Block C', 'DOHS Avenue', 'Kazipara Main Road', 'Pallabi Road 6']
  },
  {
    area: 'Bashundhara',
    center: [23.8151, 90.4257],
    addresses: ['Block A Road 1', 'Block B Road 7', 'Block C Road 10', 'Block D Lane 3', 'Bashundhara River View Road']
  }
]

export const featureImagePool = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
]

const adjectivePool = ['Modern', 'Bright', 'Lakeview', 'Elegant', 'Family-Friendly', 'Premium']
const typePool = ['Apartment', 'Condo', 'Studio', 'Family Home']
const amenitiesPool = [
  'Lift',
  'Parking',
  '24/7 Security',
  'Generator Backup',
  'Gym Access',
  'Rooftop Garden',
  'Community Hall',
  'CCTV'
]

function round(num, digits = 6) {
  return Number(num.toFixed(digits))
}

function createAmenities(index) {
  return amenitiesPool.filter((_, amenityIndex) => (amenityIndex + index) % 2 === 0).slice(0, 4)
}

export function buildDhakaProperties(managerId) {
  const properties = []

  dhakaAreas.forEach((areaData, areaIndex) => {
    areaData.addresses.forEach((address, addressIndex) => {
      const globalIndex = areaIndex * areaData.addresses.length + addressIndex
      const latitude = round(areaData.center[0] + ((addressIndex % 2 === 0 ? 1 : -1) * (0.0025 + areaIndex * 0.00025)))
      const longitude = round(areaData.center[1] + ((addressIndex % 2 === 0 ? -1 : 1) * (0.0027 + addressIndex * 0.00022)))
      const propertyType = typePool[globalIndex % typePool.length]
      const bedrooms = (globalIndex % 4) + 1
      const bathrooms = Math.max(1, bedrooms - (globalIndex % 2 === 0 ? 0 : 1))
      const squareFeet = 850 + globalIndex * 55
      const price = 24000 + globalIndex * 1700

      properties.push({
        title: `${adjectivePool[globalIndex % adjectivePool.length]} ${propertyType} in ${areaData.area}`,
        description: `A well-connected ${propertyType.toLowerCase()} in ${areaData.area}, Dhaka with easy access to schools, shopping, dining, and daily transport routes. Built for KeyCove interactive property discovery demo.`,
        price,
        propertyType,
        listingType: 'rent',
        status: 'active',
        bedrooms,
        bathrooms,
        squareFeet,
        availableFrom: new Date(Date.now() + ((globalIndex % 6) - 2) * 86400000 * 7),
        image: featureImagePool[globalIndex % featureImagePool.length],
        imageAlt: `${propertyType} in ${areaData.area}`,
        manager: managerId,
        amenities: createAmenities(globalIndex),
        location: {
          address,
          area: areaData.area,
          city: 'Dhaka',
          postalCode: `12${String(globalIndex).padStart(2, '0')}`,
          latitude,
          longitude
        },
        geoLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      })
    })
  })

  return properties
}
