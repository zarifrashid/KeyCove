# Roommate Match & Shared Lease Application System

## Backend models added
- `RoommateGroup`
- `RoommateGroupMember`
- `RoommateJoinRequest`

## Existing models extended
- `PropertyRequest`: added `applicationMode`, `roommateGroup`, and `groupSnapshot` for shared applications while keeping solo requests defaulted to `solo`.
- `TenantPropertyRecord`: supports one approved shared request creating records for every accepted registered group member.

## Backend routes added
Mounted at `/api/roommate-groups`:
- `GET /property/:propertyId?type=rent|lease`
- `POST /`
- `GET /mine`
- `GET /:groupId`
- `POST /:groupId/join-requests`
- `PATCH /join-requests/:requestId/accept`
- `PATCH /join-requests/:requestId/reject`
- `PATCH /invitations/:memberId/respond`
- `DELETE /:groupId/members/me`
- `PATCH /:groupId/cancel`
- `GET /manager`
- `GET /tenants/search?q=`

## Frontend added
- Application method selector for rent/lease only.
- Known roommate application form.
- Unknown roommate search group list and create group flow.
- Join request modal.
- Roommate group details page.
- Tenant dashboard Roommate Groups section.
- Manager request cards show shared roommate applications with group members and rent split.

## Important behavior
- Buy flow stays unchanged.
- Apply Alone uses the existing `/api/property-requests` flow.
- Incomplete roommate groups are not sent to managers.
- Shared `PropertyRequest` is created only when the accepted member count reaches target group size.
- Managers approve/reject completed shared applications through the existing request review flow.

## Test checklist
1. Tenant applies alone for rent and lease.
2. Tenant applies alone for buy.
3. Tenant creates known roommate group with manual roommates.
4. Tenant creates known roommate group with registered roommate invitations.
5. Invited roommate accepts/declines invitation.
6. Tenant creates unknown roommate search group.
7. Another tenant sends join request.
8. Creator accepts/rejects join request.
9. Group becomes full and sends one shared request to manager.
10. Manager approves/rejects shared request.
11. Accepted registered members receive notifications and approved property records.
12. Applicant cannot see phone/email before acceptance.
13. Tenant cannot apply to own group or overfill a group.

## Note
If you are using a database that already has an old unique index on `TenantPropertyRecord.sourceRequest`, drop that old index once so shared applications can create multiple tenant records for the same shared request.
