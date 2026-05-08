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

const premiumDhakaGalleryPool = [
  [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80'
  ]
]

const newDhakaPropertySeeds = [
  { seedKey: 'dhaka-more-01', title: 'Lakefront Apartment near Dhanmondi 32', area: 'Dhanmondi', address: 'Road 32 Lake Side', lat: 23.7516, lng: 90.3779, price: 42000, type: 'Apartment', listingType: 'rent', beds: 3, baths: 3, sqft: 1450, amenities: ['Lift', 'Parking', '24/7 Security', 'Generator Backup', 'Lake View', 'CCTV'] },
  { seedKey: 'dhaka-more-02', title: 'Executive Condo beside Gulshan Avenue', area: 'Gulshan', address: 'Gulshan Avenue Block SW', lat: 23.7927, lng: 90.4152, price: 85000, type: 'Condo', listingType: 'rent', beds: 3, baths: 4, sqft: 1950, amenities: ['Lift', 'Basement Parking', 'Gym Access', 'Rooftop Garden', '24/7 Security', 'Community Hall'] },
  { seedKey: 'dhaka-more-03', title: 'Quiet Family Home in Banani DOHS', area: 'Banani', address: 'Banani DOHS Road 5', lat: 23.8032, lng: 90.4012, price: 72000, type: 'Family Home', listingType: 'rent', beds: 4, baths: 4, sqft: 2200, amenities: ['Parking', 'Servant Room', 'Garden', 'Generator Backup', 'CCTV', 'Balcony'] },
  { seedKey: 'dhaka-more-04', title: 'Compact Studio close to Bashundhara Gate', area: 'Bashundhara', address: 'Block C Road 12', lat: 23.8178, lng: 90.4294, price: 26000, type: 'Studio', listingType: 'rent', beds: 1, baths: 1, sqft: 620, amenities: ['Lift', 'Security', 'Generator Backup', 'WiFi Ready', 'Balcony'] },
  { seedKey: 'dhaka-more-05', title: 'Modern Apartment in Uttara Sector 7', area: 'Uttara', address: 'Sector 7 Lake Drive', lat: 23.8742, lng: 90.3941, price: 36000, type: 'Apartment', listingType: 'rent', beds: 3, baths: 2, sqft: 1350, amenities: ['Lift', 'Parking', 'Lake View', 'CCTV', 'Generator Backup'] },
  { seedKey: 'dhaka-more-06', title: 'Spacious Mirpur DOHS Condo', area: 'Mirpur', address: 'Mirpur DOHS Avenue 2', lat: 23.8344, lng: 90.3662, price: 39000, type: 'Condo', listingType: 'rent', beds: 3, baths: 3, sqft: 1500, amenities: ['Lift', 'Parking', '24/7 Security', 'Rooftop Garden', 'Community Hall'] },
  { seedKey: 'dhaka-more-07', title: 'Lalmatia Premium Apartment', area: 'Lalmatia', address: 'Block D Road 4', lat: 23.7559, lng: 90.3697, price: 48000, type: 'Apartment', listingType: 'rent', beds: 3, baths: 3, sqft: 1520, amenities: ['Lift', 'Parking', 'Generator Backup', 'CCTV', 'Balcony', 'Family Friendly'] },
  { seedKey: 'dhaka-more-08', title: 'Niketan Parkside Condo', area: 'Niketan', address: 'Niketan Road 8', lat: 23.7808, lng: 90.4168, price: 65000, type: 'Condo', listingType: 'rent', beds: 3, baths: 3, sqft: 1750, amenities: ['Lift', 'Parking', 'Gym Access', 'Rooftop Garden', 'Security'] },
  { seedKey: 'dhaka-more-09', title: 'Baily Road Furnished Studio', area: 'Baily Road', address: 'New Baily Road Lane 3', lat: 23.7415, lng: 90.4118, price: 30000, type: 'Studio', listingType: 'rent', beds: 1, baths: 1, sqft: 700, amenities: ['Furnished', 'Lift', 'Security', 'Generator Backup', 'WiFi Ready'] },
  { seedKey: 'dhaka-more-10', title: 'Mohammadpur Family Apartment', area: 'Mohammadpur', address: 'Tajmahal Road Block C', lat: 23.7656, lng: 90.3589, price: 33000, type: 'Apartment', listingType: 'rent', beds: 3, baths: 2, sqft: 1250, amenities: ['Lift', 'Parking', 'CCTV', 'School Nearby', 'Market Nearby'] },
  { seedKey: 'dhaka-more-11', title: 'Wari Heritage Family Home', area: 'Wari', address: 'Rankin Street', lat: 23.7166, lng: 90.4162, price: 52000, type: 'Family Home', listingType: 'rent', beds: 4, baths: 3, sqft: 2050, amenities: ['Parking', 'Balcony', 'Security', 'Servant Room', 'Large Kitchen'] },
  { seedKey: 'dhaka-more-12', title: 'Motijheel Business District Studio', area: 'Motijheel', address: 'Inner Circular Road', lat: 23.7332, lng: 90.4171, price: 28000, type: 'Studio', listingType: 'rent', beds: 1, baths: 1, sqft: 650, amenities: ['Lift', 'Security', 'Generator Backup', 'Office Nearby', 'Transit Nearby'] },
  { seedKey: 'dhaka-more-13', title: 'Khilgaon South Facing Apartment', area: 'Khilgaon', address: 'Tilpapara Main Road', lat: 23.7509, lng: 90.4302, price: 31000, type: 'Apartment', listingType: 'rent', beds: 3, baths: 2, sqft: 1280, amenities: ['Lift', 'Parking', 'South Facing', 'CCTV', 'Generator Backup'] },
  { seedKey: 'dhaka-more-14', title: 'Rampura Lakeside Condo', area: 'Rampura', address: 'Banasree Main Road Link', lat: 23.7614, lng: 90.4259, price: 41000, type: 'Condo', listingType: 'rent', beds: 3, baths: 3, sqft: 1420, amenities: ['Lift', 'Parking', 'Lake View', 'Rooftop Garden', 'Security'] },
  { seedKey: 'dhaka-more-15', title: 'Malibagh Railgate Apartment', area: 'Malibagh', address: 'Chowdhury Para Road', lat: 23.7489, lng: 90.4178, price: 34000, type: 'Apartment', listingType: 'rent', beds: 2, baths: 2, sqft: 1100, amenities: ['Lift', 'Security', 'Generator Backup', 'Market Nearby'] },
  { seedKey: 'dhaka-more-16', title: 'Farmgate Transit Friendly Condo', area: 'Farmgate', address: 'Khamarbari Road', lat: 23.7592, lng: 90.3897, price: 44000, type: 'Condo', listingType: 'rent', beds: 3, baths: 2, sqft: 1380, amenities: ['Lift', 'Parking', 'Transit Nearby', 'Generator Backup', 'CCTV'] },
  { seedKey: 'dhaka-more-17', title: 'Shyamoli Family Apartment', area: 'Shyamoli', address: 'Ring Road Block B', lat: 23.7742, lng: 90.3652, price: 35000, type: 'Apartment', listingType: 'rent', beds: 3, baths: 2, sqft: 1300, amenities: ['Lift', 'Parking', 'School Nearby', 'Hospital Nearby', 'Security'] },
  { seedKey: 'dhaka-more-18', title: 'Purbachal New Town Family Home', area: 'Purbachal', address: 'Sector 4 Avenue 1', lat: 23.8374, lng: 90.5058, price: 60000, type: 'Family Home', listingType: 'rent', beds: 4, baths: 4, sqft: 2400, amenities: ['Parking', 'Garden', 'Rooftop', 'Security', 'Servant Room'] },
  { seedKey: 'dhaka-more-19', title: 'Banasree Block E Apartment', area: 'Banasree', address: 'Block E Road 9', lat: 23.7649, lng: 90.4362, price: 37000, type: 'Apartment', listingType: 'rent', beds: 3, baths: 3, sqft: 1360, amenities: ['Lift', 'Parking', 'Generator Backup', 'Lake Nearby', 'CCTV'] },
  { seedKey: 'dhaka-more-20', title: 'Moghbazar Central Apartment', area: 'Moghbazar', address: 'Wireless Gate Lane', lat: 23.7477, lng: 90.4056, price: 32000, type: 'Apartment', listingType: 'rent', beds: 2, baths: 2, sqft: 1050, amenities: ['Lift', 'Security', 'Generator Backup', 'Transit Nearby', 'Market Nearby'] }
]

function buildGalleryImages(index) {
  const pool = premiumDhakaGalleryPool[index % premiumDhakaGalleryPool.length]
  return pool.map((url, imageIndex) => ({
    url,
    sortOrder: imageIndex,
    isCover: imageIndex === 0,
    source: 'seed-url',
    uploadedAt: new Date()
  }))
}

function createPolicySet(index) {
  return {
    utilities: index % 2 === 0 ? 'Tenant pays electricity and gas; water included in service charge.' : 'Utilities are metered separately and paid by tenant monthly.',
    pet: index % 3 === 0 ? 'Small pets allowed with manager approval.' : 'Pets are not allowed without written approval.',
    income: 'Monthly household income should be at least 3x the rent.'
  }
}

function createNearbyPlaces(seed) {
  return {
    school: `${seed.area} Model School within 1 km`,
    bus: `${seed.area} bus stop within 5 minutes`,
    restaurant: `Popular restaurants and grocery shops near ${seed.address}`
  }
}

function createRoomTemplates(index) {
  return [
    { roomId: `living-${index}`, name: 'Living Room', type: 'living', width: 15, length: 18, hasBalcony: index % 2 === 0 },
    { roomId: `bed-master-${index}`, name: 'Master Bedroom', type: 'bedroom', width: 13, length: 15, hasBalcony: index % 3 === 0 },
    { roomId: `bed-second-${index}`, name: 'Second Bedroom', type: 'bedroom', width: 11, length: 12, hasBalcony: false },
    { roomId: `kitchen-${index}`, name: 'Kitchen', type: 'kitchen', width: 8, length: 10, hasBalcony: false }
  ]
}

function createFurnitureCatalog(index) {
  return [
    {
      furnitureId: `sofa-${index}`,
      name: 'Three Seat Sofa',
      category: 'living',
      modelUrl: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      color: '#0f4c81',
      dimensions: { width: 210, depth: 90, height: 85 }
    },
    {
      furnitureId: `queen-bed-${index}`,
      name: 'Queen Bed',
      category: 'bedroom',
      modelUrl: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
      color: '#8b5cf6',
      dimensions: { width: 160, depth: 210, height: 70 }
    },
    {
      furnitureId: `study-desk-${index}`,
      name: 'Study Desk',
      category: 'study',
      modelUrl: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
      color: '#16a34a',
      dimensions: { width: 120, depth: 60, height: 75 }
    }
  ]
}

export function buildNewDhakaProperties(managerId) {
  return newDhakaPropertySeeds.map((seed, index) => {
    const images = buildGalleryImages(index)

    return {
      seedKey: seed.seedKey,
      title: seed.title,
      description: `${seed.title} located at ${seed.address}, ${seed.area}, Dhaka. This listing includes realistic Dhaka location data, multiple gallery pictures, policies, nearby places, amenities, and Design Rooms-ready room templates for KeyCove demos.`,
      price: seed.price,
      rentPrice: seed.listingType === 'rent' ? seed.price : null,
      salePrice: seed.listingType === 'sale' ? seed.price : null,
      propertyType: seed.type,
      listingType: seed.listingType,
      status: 'active',
      bedrooms: seed.beds,
      bathrooms: seed.baths,
      squareFeet: seed.sqft,
      availableFrom: new Date(Date.now() + (index % 8) * 86400000),
      image: images[0]?.url || featureImagePool[index % featureImagePool.length],
      imageAlt: `${seed.title} photo`,
      images,
      manager: managerId,
      amenities: seed.amenities,
      policies: createPolicySet(index),
      nearbyPlaces: createNearbyPlaces(seed),
      arAssets: {
        propertyModelUrl: '',
        floorPlanModelUrl: '',
        furnitureCatalog: createFurnitureCatalog(index),
        roomTemplates: createRoomTemplates(index)
      },
      location: {
        address: seed.address,
        area: seed.area,
        city: 'Dhaka',
        postalCode: `13${String(index + 1).padStart(2, '0')}`,
        latitude: seed.lat,
        longitude: seed.lng
      },
      geoLocation: {
        type: 'Point',
        coordinates: [seed.lng, seed.lat]
      }
    }
  })
}
