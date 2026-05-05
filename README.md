# KeyCove

## Full Stack Real Estate and Rental Management Web Application

KeyCove is a MERN stack real estate and rental management web application built for the CSE470 project. The system helps tenants discover and evaluate properties, communicate with managers, submit applications, track leases, and use decision-support tools. Managers can create listings, manage applications, create leases, communicate with tenants, and submit verification details. Admins can manage users, roles, manager verification, announcements, and platform-level control.

---

## Course Compliance Summary

| Requirement | KeyCove Implementation |
|---|---|
| Unique project title | KeyCove - Full Stack Real Estate and Rental Management Web Application |
| Required stack restriction | Uses MERN: MongoDB, Express.js, React.js, Node.js |
| Python web frameworks | Not used. No Django, Flask, or FastAPI |
| Architecture requirement | Follows MVC-style separation with models, controllers, routes, services, and React views |
| Mandatory authentication module | Login, logout, registration, JWT sessions, role-based access |
| Counted project features | 20 features, excluding the mandatory authentication module |

---

## Team Members

| No. | Name | ID |
|---:|---|---|
| 1 | Zarif Rashid | 23201317 |
| 2 | Kazi Wahid Hasan | 23201375 |
| 3 | Inteser Hossain | 23201333 |
| 4 | Add fourth member before final submission | Add ID |

---

## Mandatory Module: Authentication and Role Access

Authentication is required for the project and is implemented separately from the 20 counted features.

Key authentication capabilities:

- User registration
- User login
- User logout
- JWT-based protected sessions
- Password hashing with bcryptjs
- Role-based access for Tenant, Manager, and Admin
- Protected frontend routes and backend APIs
- Admin accounts restricted from normal public signup flow

Main implementation files:

```text
client/src/pages/LoginPage.jsx
client/src/pages/SignupPage.jsx
client/src/context/AuthContext.jsx
client/src/components/ProtectedRoute.jsx
server/src/routes/authRoutes.js
server/src/controllers/authController.js
server/src/middleware/authMiddleware.js
server/src/models/User.js
```

---

## Project Overview

KeyCove supports three main user roles:

### Tenant

Tenants can search for properties, explore listings on a map, save favorites, submit property requests, chat with managers, view leases, receive notifications, use financial tools, use Design Rooms, and compare final choices through Decision Hub.

### Manager

Managers can create and manage property listings, upload multiple property images, review tenant requests, create leases, communicate with tenants, submit verification information, and view workflow notifications.

### Admin

Admins can manage users, change roles, suspend or restore accounts, create admin accounts, review manager verification requests, and send announcements.

---

## Counted Feature List: 20 Features

The following 20 features are the course-counted project features. The login, logout, and registration module is mandatory and is not counted in this list.

| No. | Feature | Summary |
|---:|---|---|
| 1 | Interactive Map-Based Property Discovery | Tenants can browse properties visually on a Leaflet/OpenStreetMap map with markers and property previews. |
| 2 | Advanced Server-Side Search Engine | Users can filter listings by price, beds, baths, property type, amenities, availability, location, and other listing fields. |
| 3 | Sorting Engine | Search results can be sorted by newest, price low to high, and price high to low. |
| 4 | Neighbourhood Insights | Property details show walkability, safety, school ratings, nearby places, and local insight information. |
| 5 | AI-Powered Recommendations | Tenants receive personalized property suggestions based on preferences, saved listings, and interactions. |
| 6 | Affordability Analyzer | Tenants can calculate a safe rent range using income, debt, and savings buffer. |
| 7 | Mortgage and Cost Calculator | Users can estimate monthly ownership cost using price, down payment, loan term, interest, tax, insurance, utilities, and other costs. |
| 8 | Real-Time Chat System | Tenants and managers can message each other through persistent conversations with unread tracking. |
| 9 | Real-Time Notification System | Users receive notifications for messages, requests, leases, announcements, verification, and system actions. |
| 10 | Favorites / Bookmark System | Tenants can save, revisit, and remove preferred property listings. |
| 11 | Collaborative Shared Searching | Tenants can create shared boards, invite members, add properties, comment, vote, and collaborate on property decisions. |
| 12 | Property Management / Add Property / CRUD | Managers can create, update, publish, and delete property listings. |
| 13 | Applications / Property Requests | Tenants can submit rent, lease, or buy requests for properties. |
| 14 | Application Review Workflow | Managers can approve or reject tenant property requests for their own listings. |
| 15 | Multi-Image Upload | Managers can upload multiple property images, preview them, set a cover image, and store image URLs. |
| 16 | Lease Management Module | Managers can create lease records and tenants can view current lease and residence details. |
| 17 | Admin User and Role Management | Admins can search users, change roles, suspend, restore, soft-delete, and create admin accounts. |
| 18 | Manager Verification | Managers can submit verification details and admins can approve or reject verification requests. |
| 19 | Design Rooms | Managers can prepare room layouts and tenants can create private custom furniture layouts for a property. |
| 20 | Decision Hub | Tenants can save notes, use checklists, compare properties, view trust badges, and select a final choice. |

---

## Feature Implementation Map

| Feature Area | Frontend Files | Backend Files |
|---|---|---|
| Map discovery, search, sorting | `HomePage.jsx`, `PropertyMap.jsx`, `PropertyList.jsx`, `PropertyCard.jsx`, `SearchBar.jsx`, `AdvancedFilters.jsx`, `SortDropdown.jsx`, `ActiveFilterChips.jsx` | `propertyRoutes.js`, `propertyController.js`, `Property.js`, `SearchQuery.js`, `searchFilters.js`, `searchSort.js` |
| Property management and image upload | `AddPropertyPage.jsx`, `PropertyForm.jsx`, `PropertyLocationPickerPage.jsx`, `PropertyDetailsPage.jsx` | `propertyRoutes.js`, `propertyController.js`, `uploadRoutes.js`, `uploadController.js`, `Property.js` |
| Neighbourhood insights | `NeighbourhoodInsightsSection.jsx`, `InsightLocalMap.jsx`, `PropertyDetailsPage.jsx` | `neighbourhoodController.js`, `NeighbourhoodInsight.js`, `server/src/services/neighbourhood/` |
| Recommendations and favorites | `RecommendationsPage.jsx`, `RecommendationSection.jsx`, `RecommendationCard.jsx`, `BookmarkButton.jsx`, `SavedPropertiesSection.jsx` | `recommendationRoutes.js`, `recommendationController.js`, `recommendationEngine.js`, `Favorite.js`, `Recommendation.js`, `UserPreference.js` |
| Affordability analyzer | `AffordabilityPage.jsx`, `AffordabilityForm.jsx`, `AffordabilityResultCard.jsx` | `affordabilityRoutes.js`, `affordabilityController.js`, `affordabilityService.js`, `AffordabilityAnalysis.js` |
| Mortgage calculator | `MortgageCalculatorPage.jsx`, `MortgageCalculatorForm.jsx`, `MortgageResultCard.jsx`, `MortgageCostBreakdownCard.jsx` | `mortgageRoutes.js`, `mortgageController.js`, `mortgageService.js` |
| Chat | `MessagesPage.jsx`, `ChatWindow.jsx`, `ConversationList.jsx`, `MessageBubble.jsx`, `MessageInput.jsx` | `chatRoutes.js`, `chatController.js`, `Conversation.js`, `Message.js`, `realtime.js` |
| Notifications | `NotificationContext.jsx`, `NotificationBell.jsx`, `NotificationDropdown.jsx`, `NotificationToastStack.jsx`, `NotificationsPage.jsx`, `useNotificationRealtime.js` | `notificationRoutes.js`, `notificationController.js`, `Notification.js`, `notificationService.js`, `realtime.js` |
| Applications and leases | `PropertyActionPage.jsx`, `RequestSection.jsx`, `TenantPropertyStatusSection.jsx`, `ManagerLeasesPage.jsx`, `TenantLeasesPage.jsx`, `LeaseDetailsPage.jsx`, `LeaseCard.jsx` | `propertyRequestRoutes.js`, `propertyRequestController.js`, `PropertyRequest.js`, `leaseRoutes.js`, `leaseController.js`, `Lease.js` |
| Shared boards | `SharedBoardsPage.jsx`, `SharedBoardDetailsPage.jsx`, shared board components | `boardRoutes.js`, `boardController.js`, `SharedBoard.js`, `BoardItem.js`, `BoardComment.js`, `BoardMember.js`, `Vote.js` |
| Admin and manager verification | `AdminDashboardPage.jsx`, `ManagerVerificationPanel.jsx` | `adminRoutes.js`, `adminController.js`, `managerVerificationRoutes.js`, `managerVerificationController.js`, `User.js`, `RoleAssignment.js`, `ManagerVerification.js` |
| Design Rooms and Decision Hub | `ARPropertyViewer.jsx`, `DecisionHubPage.jsx`, `DecisionNotePanel.jsx`, `PropertyComparisonBoard.jsx`, `TrustBadge.jsx`, `VisitChecklist.jsx` | `arSessionRoutes.js`, `arSessionController.js`, `ARSession.js`, `decisionHubRoutes.js`, `decisionHubController.js`, `DecisionNote.js` |

---

## Technology Stack

### Frontend

- React.js
- Vite
- React Router
- Context API
- Axios
- Leaflet and React Leaflet
- Custom CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs password hashing
- cookie-parser
- CORS middleware

### Real-Time Communication

- Server-Sent Events for chat, notifications, and shared board updates

### Development Tools

- VS Code
- Git and GitHub
- npm
- MongoDB Atlas or local MongoDB

---

## MVC Architecture

KeyCove follows MVC principles inside a MERN full-stack structure.

```text
Model Layer
server/src/models/
MongoDB and Mongoose schemas for User, Property, Message, Lease, Notification, SharedBoard, DecisionNote, and related records.

Controller Layer
server/src/controllers/
Business logic for authentication, properties, search, applications, leases, chat, notifications, admin actions, verification, recommendations, analytics, and decision features.

Route Layer
server/src/routes/
Express API route definitions that connect HTTP endpoints to controller functions.

View Layer
client/src/pages/
client/src/components/
React pages and reusable UI components that display data and collect user input.

Service Layer
server/src/services/
Reusable logic for recommendations, calculations, real-time events, notifications, neighbourhood insights, and trust scores.
```

This structure keeps database models, backend logic, API routes, and frontend views separated for maintainability.

---

## Project Structure

```text
KeyCove-main/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── seed/
│   │   ├── services/
│   │   └── server.js
│   ├── uploads/
│   ├── .env.example
│   └── package.json
│
├── DECISION_HUB_IMPLEMENTATION.md
├── ROOMMATE_MATCH_IMPLEMENTATION.md
└── README.md
```

---

## Main Frontend Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/signup` | User registration |
| `/login` | User login |
| `/explore` | Map-based property discovery and search |
| `/properties/:id` | Property details |
| `/add-property` | Manager add property page |
| `/properties/:id/edit` | Manager edit property page |
| `/properties/:id/action` | Tenant property request/application page |
| `/messages` | Chat inbox |
| `/notifications` | Notification center |
| `/recommendations` | Tenant recommendations |
| `/affordability` | Affordability analyzer |
| `/mortgage-calculator` | Mortgage and cost calculator |
| `/manager/leases` | Manager lease management |
| `/my-leases` | Tenant lease list |
| `/leases/:id` | Lease details |
| `/shared-boards` | Collaborative shared boards |
| `/shared-boards/:boardId` | Shared board details |
| `/decision-hub` | Tenant Decision Hub |
| `/admin` | Admin dashboard |

---

## Main Backend API Groups

| API Prefix | Purpose |
|---|---|
| `/api/auth` | Register, login, logout, current user |
| `/api/properties` | Property search, map, details, manager CRUD, neighbourhood insights |
| `/api/uploads` | Property image uploads |
| `/api/recommendations` | Recommendations, preferences, favorites |
| `/api/affordability` | Affordability calculations and history |
| `/api/mortgage` | Mortgage and monthly cost calculation |
| `/api/chat` | Conversations, messages, unread counts, chat stream |
| `/api/notifications` | Notification list, summary, real-time stream, read/delete actions |
| `/api/property-requests` | Tenant applications and manager review |
| `/api/leases` | Lease creation, tenant leases, manager leases, lease status |
| `/api/boards` | Shared boards, members, items, comments, votes |
| `/api/ar-session` | Design Room layout sessions |
| `/api/decision-hub` | Decision notes, comparison board, trust badge |
| `/api/admin` | Admin overview, users, roles, announcements, verification review |
| `/api/manager-verifications` | Manager verification submission and status |
| `/api/analytics` | Manager listing analytics events and dashboards |
| `/api/roommate-groups` | Roommate group and shared application support |
| `/api/property-reports` | Tenant report submission and admin review |
| `/api/recently-viewed` | Recently viewed property history |
| `/api/faqs` | Tenant FAQ help articles |

---

## Prerequisites

Install the following before running the project:

- Node.js 18 or newer
- npm
- MongoDB local server or MongoDB Atlas database
- Git, if cloning from GitHub

---

## Environment Variables

### Server Environment

Create `server/.env` from `server/.env.example`.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

Optional first-admin setup values:

```env
FIRST_ADMIN_EMAIL=admin@keycove.com
FIRST_ADMIN_PASSWORD=Admin12345
```

### Client Environment

Create `client/.env` from `client/.env.example`.

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation and Running Locally

### 1. Install and run the backend

```bash
cd server
npm install
npm run dev
```

Backend runs by default at:

```text
http://localhost:5000
```

Health check endpoints:

```text
GET http://localhost:5000/api/test
GET http://localhost:5000/api/health
```

### 2. Install and run the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs by default at:

```text
http://localhost:5173
```

---

## Creating the First Admin

Public signup should not be used to create admin accounts. After configuring `server/.env`, run the first-admin script from inside the `server` folder:

```bash
cd server
node src/scripts/createFirstAdmin.js
```

By default, the script uses:

```text
Email: admin@keycove.com
Password: Admin12345
```

For final submission or deployment, replace the default password using `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD` in the server environment file.

---

## Optional Data Seeding

The backend includes a seed route for Dhaka property sample data:

```text
POST /api/seed/dhaka-properties
```

Use this only in a development database. Do not run seed actions on important production data unless you know the route behavior.

---

## Security and Access Control

KeyCove includes:

- Password hashing using bcryptjs
- JWT authentication
- Role-based backend middleware
- Protected frontend routes
- Admin-only user and role management
- Manager-only property management
- Tenant-only private decision notes
- Tenant-private Design Room layouts
- Manager verification review by admin
- Soft-delete and suspend/restore flows for user management

---

## Non-Functional Requirements Covered

- Security through authentication and authorization
- Access control for Tenant, Manager, and Admin workflows
- Data privacy for tenant notes, decision data, and verification information
- Maintainable MVC-style folder structure
- Real-time updates through Server-Sent Events
- Responsive React UI for major pages
- Safe fallback handling for empty users, properties, leases, reports, analytics, and notifications
- Compatibility with modern browsers and MongoDB-based environments

---

## Acceptance Checklist

Use this checklist before final submission:

- [ ] Four team members are added in the README and SRS.
- [ ] Google Drive SRS link is shared only with faculty.
- [ ] Project has one unique title: KeyCove.
- [ ] The SRS contains a complete list of 20 counted features.
- [ ] Login, logout, and registration work but are not counted as project features.
- [ ] No Python web framework is used.
- [ ] MVC-style structure is explained and visible in the codebase.
- [ ] Tenant can browse, search, save, apply, chat, and view leases.
- [ ] Manager can add properties, upload images, review applications, and create leases.
- [ ] Admin can manage users, roles, announcements, and manager verification.
- [ ] Notifications update unread counts and redirect users to relevant pages.
- [ ] Design Rooms and Decision Hub keep tenant-private data protected.
- [ ] Final screenshots are added to the SRS if required by the instructor.

---

## Notes for Evaluators

KeyCove is intentionally structured as a MERN project rather than a Python-based web application. The backend is implemented using Express.js and Node.js, the frontend uses React.js, and MongoDB stores the application data. The codebase separates models, controllers, routes, services, middleware, and frontend views to satisfy the MVC architecture requirement while still following modern MERN development practices.
