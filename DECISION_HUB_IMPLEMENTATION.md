# KeyCove Decision Hub Implementation

## Feature Overview

KeyCove Decision Hub adds a tenant decision-making workflow on top of browsing, saving, and applying for properties. It combines three connected tools into one feature:

1. **Property Visit Checklist and Decision Notes** for private tenant observations.
2. **Smart Property Comparison Board** for comparing 2 to 4 shortlisted properties side by side.
3. **Listing Accuracy and Trust Badge** for transparent listing completeness signals.

The feature is designed to help tenants move from searching to inspecting, comparing, and confidently choosing a final home.

## Tenant Behavior

Tenants can:

- Add a property to Decision Hub from property cards or the property details page.
- Save private notes for each property.
- Track visit status: Not Visited, Scheduled, Visited, Shortlisted, Rejected, or Final Choice.
- Add a 1 to 5 personal rating.
- Record pros, cons, questions for the manager, and private notes.
- Complete a structured visit checklist with optional per-item notes.
- Compare 2 to 4 selected properties in `/decision-hub`.
- Mark decision tags such as Best Location, Best Value, Most Spacious, Final Choice, or Rejected.
- Open property details and Design Rooms directly from the comparison board.

Tenant notes are scoped to the logged-in tenant and are not exposed to managers or other tenants.

## Manager Behavior

Managers do not see tenant private notes. Manager listing quality affects the Trust Badge. A stronger listing score comes from:

- Uploading at least 3 property images.
- Completing address, area, city, and coordinates.
- Filling title, description, price, bedrooms, bathrooms, and square feet.
- Adding amenities.
- Adding room dimensions in the Design Rooms listing setup.
- Adding Design Rooms layout/furnishing assets.
- Having manager verification data where the project supports it.

The manager property form wording was also cleaned up so the manager-facing room setup now says **Design Rooms Listing Setup** instead of AR-focused wording.

## Backend Implementation

### New Model

`server/src/models/DecisionNote.js`

Fields:

- `userId`
- `propertyId`
- `visitStatus`
- `personalRating`
- `pros`
- `cons`
- `questionsForManager`
- `privateNotes`
- `checklist[]`
- `decisionTags[]`
- `compareSelected`
- timestamps

A unique compound index on `userId + propertyId` prevents duplicate notes for the same tenant and property.

### Trust Score Service

`server/src/services/decisionHub/trustScore.js`

Trust score is calculated dynamically. It does not overwrite existing property data.

### Routes

Mounted under `/api/decision-hub` in `server/src/server.js`.

Routes:

- `GET /api/decision-hub` — get all notes for the logged-in tenant with populated property data.
- `GET /api/decision-hub/compare/list` — get the selected comparison board items.
- `GET /api/decision-hub/:propertyId` — get a single note or a default empty note for that property.
- `POST /api/decision-hub/:propertyId` — create or update a tenant note with upsert.
- `PATCH /api/decision-hub/:propertyId/compare` — add or remove a property from comparison, with a maximum of 4 selected properties.
- `GET /api/decision-hub/trust/:propertyId` — calculate and return the listing trust badge.

Route order is important: `/compare/list` and `/trust/:propertyId` are registered before `/:propertyId` so they are not swallowed by the dynamic route.

## Frontend Implementation

### New Page

`client/src/pages/DecisionHubPage.jsx`

Accessible at:

`/decision-hub`

Protected for tenants.

### New Components

- `client/src/components/decisionHub/TrustBadge.jsx`
- `client/src/components/decisionHub/DecisionNotePanel.jsx`
- `client/src/components/decisionHub/VisitChecklist.jsx`
- `client/src/components/decisionHub/PropertyComparisonBoard.jsx`
- `client/src/components/decisionHub/ComparePropertyCard.jsx`
- `client/src/components/decisionHub/DecisionTagSelector.jsx`

### Integration Points

- `PropertyCard.jsx` now shows a compact Trust Badge and tenant Compare button.
- `PropertyDetailsPage.jsx` now includes a Decision Tools section with Trust Badge, Design Rooms availability, and editable tenant notes.
- `Navbar.jsx` now includes a Decision Hub link for tenants.
- `App.jsx` now includes the `/decision-hub` protected route.
- `PropertyForm.jsx` now presents Design Rooms setup wording for managers.

## Trust Score Calculation

| Signal | Points |
| --- | ---: |
| 3 or more images | 20 |
| 1 to 2 images | 10 |
| Full location/address/coordinates | 15 |
| Partial location | 8 |
| Complete basic info | 15 |
| Partial basic info | 8 |
| 4 or more amenities | 10 |
| 1 to 3 amenities | 5 |
| Room dimensions provided | 15 |
| Design Rooms layout/assets available | 15 |
| Manager verified | 10 |

Badge levels:

- `85+` = Excellent Listing
- `70–84` = Good Listing
- `50–69` = Fair Listing
- `<50` = Incomplete Listing

## Fallback Behavior

The feature is defensive for older or incomplete listings:

- Missing images fall back to the KeyCove logo.
- Missing address fields show “Not listed” or available partial location.
- Missing room dimensions simply contribute 0 trust points.
- Missing Design Rooms layout shows “No room design added yet.”
- Missing manager verification contributes 0 trust points.
- Tenants with no notes get a default empty note and checklist.
- Comparison board asks users to select at least two properties before rendering the matrix.
- Selecting more than four comparison properties is blocked by the backend.

## Environment Notes

`server/.env.example` supports both MongoDB variable names:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

The server database config accepts:

`process.env.MONGODB_URI || process.env.MONGO_URI`

No secrets are hardcoded.

## Testing Checklist

### Tenant Flow

1. Log in as a tenant.
2. Browse properties on the map/listing page.
3. Confirm Trust Badge appears on property cards.
4. Open a property details page.
5. Add the property to comparison.
6. Add visit notes, rating, pros, cons, questions, and checklist items.
7. Save notes.
8. Open `/decision-hub`.
9. Select or confirm 2 to 4 comparison properties.
10. Compare side by side.
11. Mark one property as Final Choice.
12. Refresh and confirm notes and comparison state persist.

### Manager Flow

1. Log in as a manager.
2. Add or edit a property.
3. Confirm the manager form shows Design Rooms Listing Setup, not AR wording.
4. Add images, address, amenities, room dimensions, and Design Rooms layout assets.
5. Open the property details page.
6. Confirm the Trust Badge reflects listing completeness.
7. Confirm tenant private notes are not visible.

### Edge Cases

- Property with no images.
- Property with missing room dimensions.
- Property without Design Rooms layout.
- Tenant with no selected comparison properties.
- More than 4 properties selected for comparison.
- Old property created before Decision Hub existed.

## Presentation Framing

KeyCove Decision Hub combines visit checklist and notes, smart property comparison, and listing trust badge into one experience. It helps tenants inspect, remember, compare, evaluate, and decide. The value is that KeyCove does not just show rental listings; it helps tenants choose the right home.
