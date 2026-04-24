# KeyCove MERN Project

CSE470 Project Repository

---

## 🏡 KeyCove – Full Stack Real Estate Platform

KeyCove is a comprehensive MERN stack real estate application designed to streamline property discovery, evaluation, and management. It provides a seamless experience for tenants searching for homes and managers handling listings, applications, and leases.

The platform integrates advanced search capabilities, interactive mapping, financial tools, and real-time communication to simulate a modern, industry-level real estate system.

---

## 🚀 Project Overview

KeyCove delivers a complete digital real estate ecosystem where:

* Tenants can discover, evaluate, and apply for properties
* Managers can manage listings and tenant interactions
* Users can make informed decisions using financial and neighborhood insights

The system is built with scalability, modularity, and real-world usability in mind.

---

## 👥 User Roles

### 🔹 Tenant

* Search and filter properties
* Explore properties using an interactive map
* View detailed listings
* Save/bookmark properties
* Apply for rentals
* Chat with property managers
* Use affordability and mortgage tools
* Track applications, leases, and payments

### 🔹 Manager

* Create, update, and manage property listings
* Upload multiple property images
* Review and manage applications
* Handle tenant communication
* Manage leases and payments

### 🔹 Admin (Planned/Extendable)

* Manage users and roles
* Moderate content
* Monitor system analytics

---

## 🌟 Core Features

### 🔍 Advanced Property Search System

* Server-side filtering (price, beds, baths, amenities, etc.)
* Sorting (price low-high, high-low, newest)
* Pagination support
* Efficient query handling

---

### 🗺️ Interactive Map-Based Property Discovery

* Built using Leaflet and OpenStreetMap
* Displays property markers dynamically
* Allows location-based search and navigation
* Integrated with property listing system

---

### 🏠 Property Management System

Managers can:

* Add new properties
* Edit and delete listings
* Upload multiple images
* Manage structured property data (location, amenities, pricing)

---

### 📄 Property Details Experience

* Full property information display
* Integrated tools and actions:

  * Contact manager
  * Save property
  * View on map
  * Apply for rental
* Serves as the central hub for user interaction

---

### 📊 Neighbourhood Insights

Displays:

* Walkability score
* Safety index
* School ratings
* Nearby places (parks, groceries, etc.)

Includes a clean tabbed UI inside the property details page.

---

### 🤖 AI-Powered Recommendations

* Personalized property suggestions
* Based on user preferences and interactions
* Enhances user discovery experience

---

### 💰 Financial Decision Tools

#### ✔ Affordability Analyzer

Calculates safe rent based on:

* Income
* Debt
* Savings buffer

#### ✔ Mortgage & Cost Calculator

* Estimates monthly payments
* Includes taxes, insurance, utilities, and HOA fees

---

### ❤️ Favorites / Bookmark System

* Save and remove properties
* Dedicated favorites page
* Quick access to preferred listings

---

### 💬 Real-Time Chat System

* Tenant ↔ Manager communication
* Persistent conversations
* Unread message tracking
* Real-time updates using Server-Sent Events (SSE)

---

### 📑 Application Management System

* Tenants can submit rental applications
* Managers can:

  * Review applications
  * Approve or reject
* Status tracking for users

---

### 🔄 Application Review Workflow

Managers can view:

* Pending
* Approved
* Denied applications

Actions trigger system updates and notifications.

---

### 📜 Lease Management Module

* Tracks tenant leases
* Displays:

  * Start/end dates
  * Monthly rent
  * Current residence details
* Supports full lease lifecycle management

---

### 🖼️ Multi-Image Upload System

* Upload multiple images per property
* Preview, reorder, and remove before submission
* Cloud storage integration

---

### 🔔 Notification System (Core Logic)

Tracks important system events such as:

* Messages
* Application updates
* System alerts

Supports unread indicators and user awareness.

---

## 🧱 Technology Stack

### Frontend

* React.js
* React Router
* Context API (State Management)
* Leaflet (Map Integration)
* CSS / Custom UI styling

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication (HTTP-only cookies)

### Real-Time Communication

* Server-Sent Events (SSE)

---

## 🏗️ System Architecture

The project follows a modular structure:

```bash
client/        → React frontend  
server/        → Express backend  
  ├── models/  
  ├── controllers/  
  ├── routes/  
  ├── middleware/  
  └── services/  
```

* Clear **separation of concerns** (routes, controllers, models)
* **Feature-based organization** for maintainability
* Designed for **scalability and extensibility**

