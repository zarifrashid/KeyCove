import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Faq from '../models/Faq.js'

dotenv.config()

const tenantFaqs = [
  {
    category: 'Getting Started',
    question: 'What is KeyCove?',
    answer: 'KeyCove is a rental property platform where tenants can explore rental homes, view property details, save listings, message managers, submit applications, track leases, get recommendations, and use helpful tools like affordability analysis and mortgage calculation.',
    keywords: ['keycove', 'platform', 'rental', 'tenant', 'property'],
    sortOrder: 1
  },
  {
    category: 'Getting Started',
    question: 'Who can use KeyCove?',
    answer: 'KeyCove supports tenants, managers, and admins. Tenants search and apply for properties, managers manage listings and applications, and admins manage platform safety and users.',
    keywords: ['tenant', 'manager', 'admin', 'roles', 'users'],
    sortOrder: 2
  },
  {
    category: 'Getting Started',
    question: 'Do I need an account to use KeyCove?',
    answer: 'You need a tenant account to access personalized features such as bookmarks, messages, recommendations, applications, leases, recently viewed properties, roommate match, and shared search boards.',
    keywords: ['account', 'signup', 'login', 'tenant', 'personalized'],
    sortOrder: 3
  },
  {
    category: 'Getting Started',
    question: 'Why can’t I access manager or admin pages?',
    answer: 'KeyCove protects pages based on user roles. Tenant accounts can only access tenant features. Manager and admin pages are restricted to authorized users.',
    keywords: ['access', 'role', 'manager', 'admin', 'forbidden'],
    sortOrder: 4
  },
  {
    category: 'Explore Map & Search',
    question: 'How do I search for rental properties?',
    answer: 'Go to the Explore Map page. You can browse available properties on the map and use search and filter options to narrow results by location, rent, property type, bedrooms, bathrooms, and other details.',
    keywords: ['explore', 'map', 'search', 'rental', 'filters'],
    sortOrder: 1
  },
  {
    category: 'Explore Map & Search',
    question: 'Can I filter properties by location?',
    answer: 'Yes. KeyCove lets you search and filter properties based on location so you can find rentals in your preferred area.',
    keywords: ['location', 'area', 'city', 'filter', 'map'],
    sortOrder: 2
  },
  {
    category: 'Explore Map & Search',
    question: 'Can I search by rent range?',
    answer: 'Yes. Use the rent filter to search for properties within your budget.',
    keywords: ['rent', 'budget', 'price', 'range', 'filter'],
    sortOrder: 3
  },
  {
    category: 'Explore Map & Search',
    question: 'Why is a property not showing on the map?',
    answer: 'A property may not appear if it does not match your current filters, if its location data is unavailable, or if it has been removed or updated by the manager.',
    keywords: ['map', 'missing', 'property', 'filters', 'location'],
    sortOrder: 4
  },
  {
    category: 'Property Details',
    question: 'What information can I see on a property page?',
    answer: 'A property details page can show rent, location, bedrooms, bathrooms, property description, images, manager information, affordability tools, mortgage tools, report option, and available tenant actions.',
    keywords: ['property details', 'rent', 'location', 'images', 'manager'],
    sortOrder: 1
  },
  {
    category: 'Property Details',
    question: 'Can I view multiple images of a property?',
    answer: 'Yes. KeyCove supports multiple property images so tenants can better understand the property before contacting the manager or applying.',
    keywords: ['images', 'gallery', 'photos', 'property'],
    sortOrder: 2
  },
  {
    category: 'Property Details',
    question: 'How do I know if a property is still available?',
    answer: 'Availability depends on the property information provided by the manager. You can also message the manager directly to confirm if the property is still available.',
    keywords: ['available', 'availability', 'manager', 'message'],
    sortOrder: 3
  },
  {
    category: 'Property Details',
    question: 'Can I report wrong property information?',
    answer: 'Yes. If a listing looks fake, incorrect, or suspicious, you can use the report listing option so admins can review it.',
    keywords: ['report', 'wrong', 'fake', 'listing', 'admin'],
    sortOrder: 4
  },
  {
    category: 'Bookmarks & Recently Viewed',
    question: 'How do I save a property?',
    answer: 'Click the bookmark or save button on a property card or property details page. The property will be added to your saved list.',
    keywords: ['save', 'bookmark', 'favorite', 'property'],
    sortOrder: 1
  },
  {
    category: 'Bookmarks & Recently Viewed',
    question: 'Where can I find my saved properties?',
    answer: 'Saved properties are available in your bookmarked or saved properties section, depending on your tenant dashboard navigation.',
    keywords: ['saved', 'bookmarks', 'favorites', 'dashboard'],
    sortOrder: 2
  },
  {
    category: 'Bookmarks & Recently Viewed',
    question: 'What is Recently Viewed?',
    answer: 'Recently Viewed shows properties you opened recently. It helps you quickly return to listings you were interested in without searching again.',
    keywords: ['recently viewed', 'history', 'viewed', 'property'],
    sortOrder: 3
  },
  {
    category: 'Bookmarks & Recently Viewed',
    question: 'Can I remove a saved property?',
    answer: 'Yes. Click the saved or bookmarked button again to remove the property from your saved list.',
    keywords: ['remove', 'unsave', 'bookmark', 'saved'],
    sortOrder: 4
  },
  {
    category: 'Recommendations',
    question: 'What does the Recommendation page do?',
    answer: 'The Recommendation page suggests properties that may match your preferences, activity, saved properties, viewed listings, and search behavior.',
    keywords: ['recommendation', 'suggested', 'properties', 'preferences'],
    sortOrder: 1
  },
  {
    category: 'Recommendations',
    question: 'Why am I seeing these recommended properties?',
    answer: 'KeyCove uses tenant preferences and interactions such as searches, bookmarks, and viewed properties to recommend more relevant listings.',
    keywords: ['recommended', 'why', 'searches', 'bookmarks', 'viewed'],
    sortOrder: 2
  },
  {
    category: 'Recommendations',
    question: 'How can I improve my recommendations?',
    answer: 'Search more accurately, save properties you like, view relevant listings, and update your preferences when available. More activity helps KeyCove understand what you are looking for.',
    keywords: ['improve', 'recommendations', 'preferences', 'save', 'search'],
    sortOrder: 3
  },
  {
    category: 'Recommendations',
    question: 'Are recommendations guaranteed to be perfect?',
    answer: 'No. Recommendations are suggestions only. You should still review property details, rent, location, and manager information before applying.',
    keywords: ['perfect', 'suggestions', 'review', 'apply'],
    sortOrder: 4
  },
  {
    category: 'Affordability & Mortgage Tools',
    question: 'What is the Affordability Analyzer?',
    answer: 'The Affordability Analyzer helps tenants estimate whether a property may fit their budget based on income, expenses, and rent-related inputs.',
    keywords: ['affordability', 'budget', 'income', 'expenses', 'rent'],
    sortOrder: 1
  },
  {
    category: 'Affordability & Mortgage Tools',
    question: 'Is the affordability result financial advice?',
    answer: 'No. The affordability result is only an estimate and should not be treated as professional financial advice.',
    keywords: ['financial advice', 'estimate', 'affordability', 'budget'],
    sortOrder: 2
  },
  {
    category: 'Affordability & Mortgage Tools',
    question: 'What does the Mortgage Calculator do?',
    answer: 'The Mortgage Calculator estimates possible mortgage-related costs using values like price, down payment, interest rate, and loan term.',
    keywords: ['mortgage', 'calculator', 'loan', 'interest', 'payment'],
    sortOrder: 3
  },
  {
    category: 'Affordability & Mortgage Tools',
    question: 'Why would a tenant use the mortgage calculator?',
    answer: 'Some tenants may compare renting and buying costs. The calculator helps them understand estimated long-term housing expenses.',
    keywords: ['tenant', 'mortgage', 'buying', 'renting', 'cost'],
    sortOrder: 4
  },
  {
    category: 'Messaging Managers',
    question: 'How do I message a manager?',
    answer: 'Open a property and use the message option to contact the manager. Your conversation will appear in the Messages page.',
    keywords: ['message', 'chat', 'manager', 'conversation'],
    sortOrder: 1
  },
  {
    category: 'Messaging Managers',
    question: 'Where can I see my messages?',
    answer: 'Click the Messages button in the tenant navbar to view your conversations with managers.',
    keywords: ['messages', 'chat', 'navbar', 'conversation'],
    sortOrder: 2
  },
  {
    category: 'Messaging Managers',
    question: 'Will I get notified when I receive a message?',
    answer: 'Yes. KeyCove can show message-related notifications through the notification bell and notification system.',
    keywords: ['message', 'notification', 'bell', 'unread'],
    sortOrder: 3
  },
  {
    category: 'Messaging Managers',
    question: 'Can I continue an old conversation?',
    answer: 'Yes. Open the Messages page and select the previous conversation to continue chatting.',
    keywords: ['old conversation', 'continue', 'messages', 'chat'],
    sortOrder: 4
  },
  {
    category: 'Property Applications',
    question: 'How do I apply for a property?',
    answer: 'Open the property details page and use the application option. Fill in the required details and submit your request to the manager.',
    keywords: ['apply', 'application', 'property', 'request'],
    sortOrder: 1
  },
  {
    category: 'Property Applications',
    question: 'Where can I see my application status?',
    answer: 'You can track your submitted applications from the tenant dashboard or application-related sections.',
    keywords: ['application status', 'tenant dashboard', 'pending', 'accepted'],
    sortOrder: 2
  },
  {
    category: 'Property Applications',
    question: 'What does pending mean?',
    answer: 'Pending means your application has been submitted and is waiting for the manager to review it.',
    keywords: ['pending', 'application', 'review', 'manager'],
    sortOrder: 3
  },
  {
    category: 'Property Applications',
    question: 'What happens if my application is accepted?',
    answer: 'If accepted, the next steps may include lease preparation, communication with the manager, and lease status tracking inside KeyCove.',
    keywords: ['accepted', 'application', 'lease', 'manager'],
    sortOrder: 4
  },
  {
    category: 'Property Applications',
    question: 'What happens if my application is rejected?',
    answer: 'If rejected, you can continue searching and apply for other properties that match your needs.',
    keywords: ['rejected', 'application', 'search', 'apply'],
    sortOrder: 5
  },
  {
    category: 'Lease Management',
    question: 'Where can I see my leases?',
    answer: 'Tenant leases are available from the tenant lease section. There you can view lease details connected to your accepted rental process.',
    keywords: ['lease', 'leases', 'tenant lease', 'details'],
    sortOrder: 1
  },
  {
    category: 'Lease Management',
    question: 'What information is shown in lease details?',
    answer: 'Lease details may include property information, tenant information, manager information, lease status, rent amount, start date, end date, and other lease-related details.',
    keywords: ['lease details', 'rent amount', 'start date', 'end date', 'status'],
    sortOrder: 2
  },
  {
    category: 'Lease Management',
    question: 'Can I track lease status?',
    answer: 'Yes. KeyCove includes lease status tracking so tenants can understand the current stage of their lease.',
    keywords: ['lease status', 'track', 'lease', 'stage'],
    sortOrder: 3
  },
  {
    category: 'Lease Management',
    question: 'What should I do if lease information looks wrong?',
    answer: 'Contact the manager through messages and ask them to correct or confirm the lease information.',
    keywords: ['lease wrong', 'manager', 'message', 'correct'],
    sortOrder: 4
  },
  {
    category: 'Roommate Match',
    question: 'What is Roommate Match?',
    answer: 'Roommate Match helps tenants search for properties with roommates and estimate how rent can be split between people.',
    keywords: ['roommate', 'match', 'rent split', 'group'],
    sortOrder: 1
  },
  {
    category: 'Roommate Match',
    question: 'How does rent split work?',
    answer: 'KeyCove calculates an estimated per-person rent by dividing the property rent based on the number of roommates or group members.',
    keywords: ['rent split', 'roommates', 'per person', 'budget'],
    sortOrder: 2
  },
  {
    category: 'Roommate Match',
    question: 'Can I search with known roommates?',
    answer: 'Yes. KeyCove supports roommate-related flows where tenants can search with known roommates or create and join roommate groups.',
    keywords: ['known roommates', 'search', 'roommate group', 'join'],
    sortOrder: 3
  },
  {
    category: 'Roommate Match',
    question: 'Can I join a roommate group?',
    answer: 'Yes. If roommate group features are enabled, tenants can request to join or manage roommate groups depending on the available options.',
    keywords: ['join', 'roommate group', 'request', 'tenant'],
    sortOrder: 4
  },
  {
    category: 'Shared Search & Decision Hub',
    question: 'What is Shared Search?',
    answer: 'Shared Search lets tenants collaborate when choosing properties. It is useful when roommates or multiple people are deciding together.',
    keywords: ['shared search', 'collaborate', 'board', 'roommates'],
    sortOrder: 1
  },
  {
    category: 'Shared Search & Decision Hub',
    question: 'What is Decision Hub?',
    answer: 'Decision Hub helps tenants compare properties, keep notes, check important details, and make a more organized rental decision.',
    keywords: ['decision hub', 'compare', 'notes', 'decision'],
    sortOrder: 2
  },
  {
    category: 'Shared Search & Decision Hub',
    question: 'Can I compare properties?',
    answer: 'Yes. Decision Hub includes property comparison tools so tenants can review multiple options more clearly.',
    keywords: ['compare', 'properties', 'decision hub', 'shortlist'],
    sortOrder: 3
  },
  {
    category: 'Shared Search & Decision Hub',
    question: 'Can I keep notes before deciding?',
    answer: 'Yes. KeyCove includes note and decision-related tools to help tenants remember important points about each property.',
    keywords: ['notes', 'decision', 'property', 'remember'],
    sortOrder: 4
  },
  {
    category: 'Reports & Safety',
    question: 'How do I report a fake listing?',
    answer: 'Open the property details page and click the report option. Choose a reason and submit your report for admin review.',
    keywords: ['report', 'fake listing', 'admin review', 'safety'],
    sortOrder: 1
  },
  {
    category: 'Reports & Safety',
    question: 'What happens after I report a listing?',
    answer: 'The report is sent for review. Admins can check the listing and take action if the property is fake, incorrect, or unsafe.',
    keywords: ['report', 'review', 'admin', 'unsafe'],
    sortOrder: 2
  },
  {
    category: 'Reports & Safety',
    question: 'How can I know if a manager is verified?',
    answer: 'KeyCove can show manager verification information where available. Verified managers are safer to contact than unverified or suspicious accounts.',
    keywords: ['verified manager', 'verification', 'safe', 'manager'],
    sortOrder: 3
  },
  {
    category: 'Reports & Safety',
    question: 'What should I do if a manager asks for suspicious payment?',
    answer: 'Do not send money outside trusted processes. Report the listing or manager and contact platform support or admin through the available reporting system.',
    keywords: ['payment', 'suspicious', 'report', 'manager', 'safety'],
    sortOrder: 4
  },
  {
    category: 'Notifications',
    question: 'What notifications will I receive?',
    answer: 'Tenants may receive notifications for messages, application status updates, lease updates, roommate activity, shared board activity, and system alerts.',
    keywords: ['notifications', 'messages', 'application', 'lease', 'alerts'],
    sortOrder: 1
  },
  {
    category: 'Notifications',
    question: 'Why do I see a red badge on the notification bell?',
    answer: 'The red badge means you have unread notifications.',
    keywords: ['red badge', 'notification bell', 'unread', 'alerts'],
    sortOrder: 2
  },
  {
    category: 'Notifications',
    question: 'How do I mark notifications as read?',
    answer: 'Open the notification dropdown or notification page and use the mark-as-read option if available.',
    keywords: ['mark read', 'notifications', 'bell', 'unread'],
    sortOrder: 3
  },
  {
    category: 'Notifications',
    question: 'Can I open notification details?',
    answer: 'Yes. Some notifications can take you directly to the related page, such as messages, applications, leases, or reports.',
    keywords: ['notification details', 'open', 'messages', 'applications'],
    sortOrder: 4
  },
  {
    category: 'Account Help',
    question: 'How do I update my profile?',
    answer: 'Use the profile or account section if available. Some information may be connected to your signup details.',
    keywords: ['profile', 'account', 'update', 'signup'],
    sortOrder: 1
  },
  {
    category: 'Account Help',
    question: 'How do I logout?',
    answer: 'Open the profile menu from the navbar and click logout.',
    keywords: ['logout', 'sign out', 'profile menu', 'navbar'],
    sortOrder: 2
  },
  {
    category: 'Account Help',
    question: 'Why is FAQ only available for tenants?',
    answer: 'This FAQ page is designed specifically for tenant questions. Managers and admins have different responsibilities and do not need the same tenant help center.',
    keywords: ['faq', 'tenant only', 'manager', 'admin'],
    sortOrder: 3
  },
  {
    category: 'Account Help',
    question: 'What should I do if something does not work?',
    answer: 'Refresh the page, check your internet connection, and try again. If the issue continues, contact the manager or platform admin depending on the problem.',
    keywords: ['problem', 'not working', 'support', 'refresh'],
    sortOrder: 4
  }
]

async function seedFaqs() {
  await connectDB()

  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not connected. Add MONGODB_URI or MONGO_URI in server/.env and run again.')
  }

  let inserted = 0
  let skipped = 0

  for (const faq of tenantFaqs) {
    const existing = await Faq.findOne({ question: faq.question })
    if (existing) {
      skipped += 1
      continue
    }

    await Faq.create({
      ...faq,
      role: 'tenant',
      isActive: true
    })
    inserted += 1
  }

  console.log(`Tenant FAQ seed complete. Inserted: ${inserted}. Skipped existing: ${skipped}.`)
}

seedFaqs()
  .catch((error) => {
    console.error('Tenant FAQ seed failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
