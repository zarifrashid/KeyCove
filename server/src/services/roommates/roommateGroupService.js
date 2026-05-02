import crypto from 'crypto'
import mongoose from 'mongoose'
import Property from '../../models/Property.js'
import PropertyRequest from '../../models/PropertyRequest.js'
import RoommateGroup from '../../models/RoommateGroup.js'
import RoommateGroupMember from '../../models/RoommateGroupMember.js'
import RoommateJoinRequest from '../../models/RoommateJoinRequest.js'
import TenantPropertyRecord from '../../models/TenantPropertyRecord.js'
import User from '../../models/User.js'
import { createBulkNotificationsForUsers, createNotification } from '../notifications/notificationService.js'

export const ACTIVE_GROUP_STATUSES = ['open', 'waiting_for_known_roommates', 'full', 'ready_for_manager', 'sent_to_manager']
const PUBLIC_GROUP_STATUSES = ['open', 'waiting_for_known_roommates']

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function parseOptionalNumber(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toId(value) {
  return value?._id?.toString?.() || value?.toString?.() || ''
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value)
}

function resolveMonthlyRent(property) {
  const rentPrice = parseOptionalNumber(property?.rentPrice)
  if (rentPrice && rentPrice > 0) return rentPrice
  const legacyPrice = parseOptionalNumber(property?.price)
  if (legacyPrice && legacyPrice > 0) return legacyPrice
  return null
}

export function calculateRentPerPerson(property, targetGroupSize, actionType = 'rent', leaseMonths = null) {
  const monthlyRent = resolveMonthlyRent(property)
  const people = Math.max(1, Number(targetGroupSize || 1))
  const rentPerPerson = monthlyRent ? Math.ceil(monthlyRent / people) : null
  const normalizedLeaseMonths = actionType === 'lease' ? parseOptionalNumber(leaseMonths) : null
  const totalCost = actionType === 'lease' && monthlyRent && normalizedLeaseMonths
    ? monthlyRent * normalizedLeaseMonths
    : monthlyRent

  return {
    monthlyRent,
    rentPerPerson,
    totalCost,
    leaseMonths: normalizedLeaseMonths
  }
}

export function buildTenantSnapshot(user = {}, payload = {}) {
  const profile = user?.applicationProfile || {}
  return {
    name: normalizeString(payload.name || user.name),
    email: normalizeString(payload.email || user.email).toLowerCase(),
    phone: normalizeString(payload.phone || user.phone || profile.phone),
    occupation: normalizeString(payload.occupation || profile.occupation),
    monthlyIncome: parseOptionalNumber(payload.monthlyIncome ?? profile.monthlyIncome),
    employmentStatus: normalizeString(payload.employmentStatus || profile.employmentStatus),
    employerName: normalizeString(payload.employerName || payload.employer || profile.employerName),
    currentAddress: normalizeString(payload.currentAddress || profile.currentAddress),
    additionalInfo: normalizeString(payload.additionalInfo || profile.additionalInfo)
  }
}

function buildMemberSnapshot(member = {}, exposePrivate = false) {
  const snapshot = member.tenantSnapshot || {}
  const user = member.user || {}

  return {
    _id: member._id,
    user: user?._id || member.user || null,
    memberType: member.memberType,
    status: member.status,
    name: snapshot.name || user.name || 'Tenant',
    occupation: snapshot.occupation || user.applicationProfile?.occupation || '',
    employmentStatus: snapshot.employmentStatus || user.applicationProfile?.employmentStatus || '',
    shortIntro: snapshot.additionalInfo || '',
    monthlyIncome: exposePrivate ? snapshot.monthlyIncome : undefined,
    email: exposePrivate ? (snapshot.email || user.email || '') : undefined,
    phone: exposePrivate ? (snapshot.phone || user.phone || '') : undefined,
    currentAddress: exposePrivate ? snapshot.currentAddress : undefined,
    employerName: exposePrivate ? snapshot.employerName : undefined,
    relationshipToCreator: member.relationshipToCreator || '',
    expectedContribution: member.expectedContribution ?? null,
    joinedAt: member.joinedAt || member.createdAt,
    createdAt: member.createdAt
  }
}

export async function mapRoommateGroup(group, viewer = null, options = {}) {
  const groupId = toId(group)
  const [members, joinRequests] = await Promise.all([
    RoommateGroupMember.find({ group: groupId })
      .populate('user', 'name email phone role applicationProfile createdAt')
      .sort({ createdAt: 1 })
      .lean(),
    options.includeJoinRequests
      ? RoommateJoinRequest.find({ group: groupId })
        .populate('applicant', 'name email phone role applicationProfile createdAt')
        .sort({ createdAt: -1 })
        .lean()
      : []
  ])

  const viewerId = viewer?.userId || viewer?._id?.toString?.() || viewer?.toString?.() || ''
  const isCreator = viewerId && toId(group.creator) === viewerId
  const isManager = viewerId && toId(group.manager) === viewerId
  const isAdmin = viewer?.role === 'admin'
  const isAcceptedMember = members.some((member) => toId(member.user) === viewerId && member.status === 'accepted')
  const canSeePrivate = Boolean(isCreator || isManager || isAdmin || isAcceptedMember || options.exposePrivate)

  const acceptedMembers = members
    .filter((member) => member.status === 'accepted')
    .map((member) => buildMemberSnapshot(member, canSeePrivate))

  const pendingInvitations = canSeePrivate
    ? members.filter((member) => member.status === 'pending_invitation').map((member) => buildMemberSnapshot(member, canSeePrivate))
    : []

  const mappedJoinRequests = canSeePrivate
    ? joinRequests.map((request) => ({
      _id: request._id,
      status: request.status,
      applicant: request.applicant,
      applicantSnapshot: request.applicantSnapshot || {},
      introMessage: request.introMessage || '',
      lifestyleNote: request.lifestyleNote || '',
      expectedContribution: request.expectedContribution ?? null,
      createdAt: request.createdAt,
      decidedAt: request.decidedAt || null
    }))
    : []

  return {
    _id: group._id,
    property: group.property,
    manager: group.manager,
    creator: group.creator,
    actionType: group.actionType,
    applicationMode: group.applicationMode,
    targetGroupSize: group.targetGroupSize,
    acceptedMemberCount: group.acceptedMemberCount,
    remainingSlots: group.remainingSlots,
    leaseMonths: group.leaseMonths,
    moveInDate: group.moveInDate,
    monthlyRent: group.monthlyRent,
    rentPerPerson: group.rentPerPerson,
    totalCost: group.totalCost,
    status: group.status,
    preferences: group.preferences || {},
    introMessage: group.introMessage || '',
    messageToManager: canSeePrivate ? group.messageToManager || '' : '',
    sourcePropertyRequest: group.sourcePropertyRequest || null,
    acceptedMembers,
    pendingInvitations,
    joinRequests: mappedJoinRequests,
    viewerState: {
      isCreator,
      isManager,
      isAcceptedMember,
      canSeePrivate,
      canManageRequests: isCreator
    },
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  }
}

async function getGroupOrThrow(groupId) {
  const group = await RoommateGroup.findById(groupId)
    .populate('property', 'title image location listingType status price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
    .populate('creator', 'name email phone role applicationProfile createdAt')
    .populate('manager', 'name email phone role companyName')

  if (!group) {
    const error = new Error('Roommate group not found.')
    error.statusCode = 404
    throw error
  }

  return group
}

async function ensureNoActiveRoommateConflict({ tenantId, propertyId, actionType, exceptGroupId = null }) {
  const memberRecords = await RoommateGroupMember.find({
    user: tenantId,
    status: { $in: ['accepted', 'pending_invitation'] }
  }).select('group')

  const memberGroupIds = memberRecords.map((item) => item.group).filter(Boolean)
  const groupFilter = {
    property: propertyId,
    actionType,
    status: { $in: ACTIVE_GROUP_STATUSES },
    $or: [
      { creator: tenantId },
      { _id: { $in: memberGroupIds } }
    ]
  }

  if (exceptGroupId) groupFilter._id = { $ne: exceptGroupId }

  const activeGroup = await RoommateGroup.findOne(groupFilter).select('_id')
  if (activeGroup) {
    const error = new Error('You already have an active roommate group for this property and action type.')
    error.statusCode = 400
    throw error
  }

  const activeJoinRequest = await RoommateJoinRequest.findOne({
    property: propertyId,
    applicant: tenantId,
    status: 'pending'
  }).populate('group', 'actionType status')

  if (
    activeJoinRequest?.group &&
    activeJoinRequest.group.actionType === actionType &&
    ACTIVE_GROUP_STATUSES.includes(activeJoinRequest.group.status)
  ) {
    const error = new Error('You already have a pending roommate join request for this property and action type.')
    error.statusCode = 400
    throw error
  }
}

async function refreshGroupCounts(groupId) {
  const group = await RoommateGroup.findById(groupId)
  if (!group) return null

  const acceptedCount = await RoommateGroupMember.countDocuments({ group: groupId, status: 'accepted' })
  group.acceptedMemberCount = acceptedCount
  group.remainingSlots = Math.max(0, Number(group.targetGroupSize || 0) - acceptedCount)

  if (['cancelled', 'expired', 'manager_approved', 'manager_rejected', 'sent_to_manager'].includes(group.status)) {
    await group.save()
    return group
  }

  if (acceptedCount >= group.targetGroupSize) {
    group.status = 'full'
  } else if (group.applicationMode === 'known_roommates') {
    group.status = 'waiting_for_known_roommates'
  } else {
    group.status = 'open'
  }

  await group.save()
  return group
}

async function getAcceptedRegisteredMemberIds(groupId) {
  const members = await RoommateGroupMember.find({ group: groupId, status: 'accepted', user: { $ne: null } }).select('user')
  return members.map((member) => toId(member.user)).filter(Boolean)
}

async function notifyGroupMembers(groupId, payload = {}, exceptUserIds = []) {
  const ids = await getAcceptedRegisteredMemberIds(groupId)
  const except = new Set(exceptUserIds.map(String))
  return createBulkNotificationsForUsers(
    ids.filter((id) => !except.has(id)),
    payload
  )
}

export async function submitGroupToManager(groupId) {
  let group = await getGroupOrThrow(groupId)

  if (group.status === 'sent_to_manager' || group.sourcePropertyRequest) return group
  if (!['rent', 'lease'].includes(group.actionType)) return group
  if (group.property?.status !== 'active') {
    group.status = 'cancelled'
    await group.save()
    return group
  }

  const acceptedMembers = await RoommateGroupMember.find({ group: group._id, status: 'accepted' })
    .populate('user', 'name email phone role applicationProfile createdAt')
    .sort({ createdAt: 1 })
    .lean()

  if (acceptedMembers.length !== Number(group.targetGroupSize)) {
    await refreshGroupCounts(group._id)
    return group
  }

  const creatorMember = acceptedMembers.find((member) => toId(member.user) === toId(group.creator))
  if (!creatorMember) {
    const error = new Error('Group creator must be an accepted member before submitting to the manager.')
    error.statusCode = 400
    throw error
  }

  const now = new Date()
  const acceptedMemberSnapshots = acceptedMembers.map((member) => {
    const snapshot = member.tenantSnapshot || {}
    const user = member.user || {}
    return {
      user: user?._id || member.user || null,
      memberType: member.memberType,
      name: snapshot.name || user.name || '',
      email: snapshot.email || user.email || '',
      phone: snapshot.phone || user.phone || '',
      occupation: snapshot.occupation || user.applicationProfile?.occupation || '',
      employmentStatus: snapshot.employmentStatus || user.applicationProfile?.employmentStatus || '',
      monthlyIncome: snapshot.monthlyIncome ?? user.applicationProfile?.monthlyIncome ?? null,
      expectedContribution: member.expectedContribution ?? null,
      relationshipToCreator: member.relationshipToCreator || ''
    }
  })

  const creatorSnapshot = acceptedMemberSnapshots.find((member) => toId(member.user) === toId(group.creator)) || acceptedMemberSnapshots[0]

  const existingRequest = await PropertyRequest.findOne({ roommateGroup: group._id, applicationMode: 'roommate_group' })
  let request = existingRequest

  if (!request) {
    request = await PropertyRequest.create({
      property: group.property._id || group.property,
      tenant: group.creator._id || group.creator,
      manager: group.manager._id || group.manager,
      actionType: group.actionType,
      applicationMode: 'roommate_group',
      roommateGroup: group._id,
      tenantSnapshot: {
        name: creatorSnapshot.name || group.creator?.name || '',
        email: creatorSnapshot.email || group.creator?.email || '',
        phone: creatorSnapshot.phone || group.creator?.phone || '',
        occupation: creatorSnapshot.occupation || '',
        monthlyIncome: creatorSnapshot.monthlyIncome ?? null,
        employmentStatus: creatorSnapshot.employmentStatus || '',
        employerName: '',
        currentAddress: '',
        additionalInfo: group.introMessage || ''
      },
      pricing: {
        monthlyRent: group.monthlyRent,
        salePrice: null,
        leaseMonths: group.actionType === 'lease' ? group.leaseMonths : null,
        totalCost: group.totalCost
      },
      note: group.messageToManager || '',
      groupSnapshot: {
        groupId: group._id,
        targetGroupSize: group.targetGroupSize,
        rentPerPerson: group.rentPerPerson,
        acceptedMembers: acceptedMemberSnapshots,
        preferences: group.preferences || {},
        messageToManager: group.messageToManager || ''
      },
      statusHistory: [
        {
          status: 'pending',
          changedAt: now,
          changedBy: group.creator._id || group.creator
        }
      ]
    })
  }

  group.status = 'sent_to_manager'
  group.sourcePropertyRequest = request._id
  group.acceptedMemberCount = acceptedMembers.length
  group.remainingSlots = 0
  await group.save()

  await RoommateJoinRequest.updateMany(
    { group: group._id, status: 'pending' },
    { $set: { status: 'cancelled', decidedAt: now, decidedBy: group.creator._id || group.creator } }
  )

  await createNotification({
    userId: group.manager._id || group.manager,
    actorId: group.creator._id || group.creator,
    title: 'Complete roommate application received',
    body: `A complete roommate group applied for ${group.property?.title || 'this property'}.`,
    type: 'application',
    relatedEntityType: 'propertyRequest',
    relatedEntityId: request._id,
    actionUrl: `/property-requests/${request._id}`,
    priority: 'high'
  })

  await notifyGroupMembers(group._id, {
    actorId: group.creator._id || group.creator,
    title: 'Roommate group complete',
    body: `Your roommate group is complete. The shared application for ${group.property?.title || 'this property'} has been sent to the manager.`,
    type: 'application',
    relatedEntityType: 'roommateGroup',
    relatedEntityId: group._id,
    actionUrl: `/roommate-groups/${group._id}`,
    priority: 'high',
    skipActor: false
  })

  return group
}

async function refreshAndSubmitIfReady(groupId) {
  const group = await refreshGroupCounts(groupId)
  if (!group) return null
  if (group.acceptedMemberCount >= group.targetGroupSize && !group.sourcePropertyRequest) {
    return submitGroupToManager(groupId)
  }
  return group
}

export async function createRoommateGroup({ userId, payload = {}, currentUser = {} }) {
  const actionType = normalizeString(payload.actionType).toLowerCase()
  if (!['rent', 'lease'].includes(actionType)) {
    const error = new Error('Roommate applications are only available for rent or lease.')
    error.statusCode = 400
    throw error
  }

  const applicationMode = payload.applicationMode === 'known_roommates' ? 'known_roommates' : 'unknown_roommate_search'
  const targetGroupSize = parseOptionalNumber(payload.targetGroupSize)
  if (!targetGroupSize || targetGroupSize < 2) {
    const error = new Error('Total group size must be at least 2 people.')
    error.statusCode = 400
    throw error
  }

  const property = await Property.findById(payload.propertyId).populate('manager', 'name email phone role companyName')
  if (!property || property.status !== 'active') {
    const error = new Error('Property not found or not active.')
    error.statusCode = 404
    throw error
  }

  if (toId(property.manager) === String(userId)) {
    const error = new Error('You cannot create a roommate group for your own managed property.')
    error.statusCode = 400
    throw error
  }

  await ensureNoActiveRoommateConflict({ tenantId: userId, propertyId: property._id, actionType })

  const pricing = calculateRentPerPerson(property, targetGroupSize, actionType, payload.leaseMonths)
  if (!pricing.monthlyRent) {
    const error = new Error('This property is not available for rent or lease right now.')
    error.statusCode = 400
    throw error
  }

  if (actionType === 'lease' && (!pricing.leaseMonths || pricing.leaseMonths <= 0)) {
    const error = new Error('Lease months must be greater than 0 for shared lease applications.')
    error.statusCode = 400
    throw error
  }

  const now = new Date()
  const group = await RoommateGroup.create({
    property: property._id,
    manager: property.manager._id || property.manager,
    creator: userId,
    actionType,
    applicationMode,
    targetGroupSize,
    acceptedMemberCount: 1,
    remainingSlots: Math.max(0, targetGroupSize - 1),
    leaseMonths: actionType === 'lease' ? pricing.leaseMonths : null,
    moveInDate: payload.moveInDate || null,
    monthlyRent: pricing.monthlyRent,
    rentPerPerson: pricing.rentPerPerson,
    totalCost: pricing.totalCost,
    status: applicationMode === 'known_roommates' ? 'waiting_for_known_roommates' : 'open',
    preferences: payload.preferences || {},
    introMessage: normalizeString(payload.introMessage),
    messageToManager: normalizeString(payload.messageToManager),
    expiresAt: payload.expiresAt || null
  })

  const creatorSnapshot = buildTenantSnapshot(currentUser, payload.creatorSnapshot || payload.applicantSnapshot || {})
  await RoommateGroupMember.create({
    group: group._id,
    user: userId,
    memberType: 'creator',
    status: 'accepted',
    addedBy: userId,
    tenantSnapshot: creatorSnapshot,
    relationshipToCreator: 'Self',
    expectedContribution: pricing.rentPerPerson,
    joinedAt: now
  })

  if (applicationMode === 'known_roommates') {
    const roommates = Array.isArray(payload.roommates) ? payload.roommates : []
    if (roommates.length !== targetGroupSize - 1) {
      const error = new Error('Please add roommate details for every remaining group slot.')
      error.statusCode = 400
      throw error
    }

    for (const roommate of roommates) {
      const mode = roommate.mode || roommate.roommateType || 'manual'
      if (mode === 'registered') {
        let tenant = null
        if (roommate.userId && isObjectId(roommate.userId)) {
          tenant = await User.findOne({ _id: roommate.userId, role: 'tenant', accountStatus: { $ne: 'deleted' } })
        }
        if (!tenant && roommate.email) {
          tenant = await User.findOne({ email: normalizeString(roommate.email).toLowerCase(), role: 'tenant', accountStatus: { $ne: 'deleted' } })
        }
        if (!tenant) {
          const error = new Error(`Registered roommate ${roommate.email || ''} was not found.`)
          error.statusCode = 400
          throw error
        }
        if (toId(tenant) === String(userId)) {
          const error = new Error('You are already the group creator.')
          error.statusCode = 400
          throw error
        }

        const snapshot = buildTenantSnapshot(tenant, roommate)
        const member = await RoommateGroupMember.create({
          group: group._id,
          user: tenant._id,
          memberType: 'known_registered',
          status: 'pending_invitation',
          addedBy: userId,
          invitationToken: crypto.randomBytes(16).toString('hex'),
          tenantSnapshot: snapshot,
          relationshipToCreator: normalizeString(roommate.relationshipToCreator),
          expectedContribution: parseOptionalNumber(roommate.expectedContribution, pricing.rentPerPerson)
        })

        await createNotification({
          userId: tenant._id,
          actorId: userId,
          title: 'Roommate application invitation',
          body: `${currentUser.name || 'A tenant'} invited you to join a shared ${actionType} application for ${property.title}.`,
          type: 'application',
          relatedEntityType: 'roommateGroup',
          relatedEntityId: group._id,
          actionUrl: `/roommate-groups/${group._id}`,
          priority: 'high'
        })
      } else {
        const requiredName = normalizeString(roommate.name || roommate.fullName)
        const requiredEmail = normalizeString(roommate.email)
        const requiredPhone = normalizeString(roommate.phone)
        const requiredOccupation = normalizeString(roommate.occupation)
        if (!requiredName || !requiredEmail || !requiredPhone || !requiredOccupation) {
          const error = new Error('Manual roommates require name, email, phone, and occupation.')
          error.statusCode = 400
          throw error
        }

        await RoommateGroupMember.create({
          group: group._id,
          user: null,
          memberType: 'known_manual',
          status: 'accepted',
          addedBy: userId,
          tenantSnapshot: buildTenantSnapshot({}, { ...roommate, name: requiredName }),
          relationshipToCreator: normalizeString(roommate.relationshipToCreator),
          expectedContribution: parseOptionalNumber(roommate.expectedContribution, pricing.rentPerPerson),
          joinedAt: now
        })
      }
    }
  }

  const refreshedGroup = await refreshAndSubmitIfReady(group._id)
  const latestGroup = refreshedGroup || await getGroupOrThrow(group._id)

  await createNotification({
    userId,
    actorId: userId,
    title: 'Roommate group created',
    body: `Your roommate group has been created for ${property.title}. Waiting for ${Math.max(0, latestGroup.targetGroupSize - latestGroup.acceptedMemberCount)} more roommate${Math.max(0, latestGroup.targetGroupSize - latestGroup.acceptedMemberCount) === 1 ? '' : 's'}.`,
    type: 'application',
    relatedEntityType: 'roommateGroup',
    relatedEntityId: group._id,
    actionUrl: `/roommate-groups/${group._id}`,
    priority: 'normal',
    skipActor: false
  })

  return latestGroup
}

export async function createJoinRequest({ groupId, userId, payload = {}, currentUser = {} }) {
  const group = await getGroupOrThrow(groupId)

  if (group.applicationMode !== 'unknown_roommate_search') {
    const error = new Error('Join requests are only available for roommate search groups.')
    error.statusCode = 400
    throw error
  }

  if (!PUBLIC_GROUP_STATUSES.includes(group.status)) {
    const error = new Error('This roommate group is not accepting new requests.')
    error.statusCode = 400
    throw error
  }

  if (toId(group.creator) === String(userId)) {
    const error = new Error('You cannot apply to join your own roommate group.')
    error.statusCode = 400
    throw error
  }

  await ensureNoActiveRoommateConflict({ tenantId: userId, propertyId: group.property._id || group.property, actionType: group.actionType })

  const acceptedCount = await RoommateGroupMember.countDocuments({ group: group._id, status: 'accepted' })
  if (acceptedCount >= group.targetGroupSize) {
    const error = new Error('This roommate group is already full.')
    error.statusCode = 400
    throw error
  }

  const existingMember = await RoommateGroupMember.findOne({ group: group._id, user: userId, status: { $in: ['accepted', 'pending_invitation'] } })
  if (existingMember) {
    const error = new Error('You are already connected to this group.')
    error.statusCode = 400
    throw error
  }

  const request = await RoommateJoinRequest.create({
    group: group._id,
    property: group.property._id || group.property,
    applicant: userId,
    host: group.creator._id || group.creator,
    status: 'pending',
    applicantSnapshot: buildTenantSnapshot(currentUser, payload),
    introMessage: normalizeString(payload.introMessage || payload.reason),
    lifestyleNote: normalizeString(payload.lifestyleNote),
    expectedContribution: parseOptionalNumber(payload.expectedContribution, group.rentPerPerson)
  })

  await createNotification({
    userId: group.creator._id || group.creator,
    actorId: userId,
    title: 'New roommate join request',
    body: `${currentUser.name || 'A tenant'} wants to join your roommate group for ${group.property?.title || 'this property'}.`,
    type: 'application',
    relatedEntityType: 'roommateJoinRequest',
    relatedEntityId: request._id,
    actionUrl: `/roommate-groups/${group._id}`,
    priority: 'high'
  })

  return request
}

export async function acceptJoinRequest({ requestId, userId }) {
  const request = await RoommateJoinRequest.findById(requestId).populate('applicant', 'name email phone role applicationProfile createdAt')
  if (!request) {
    const error = new Error('Join request not found.')
    error.statusCode = 404
    throw error
  }

  const group = await getGroupOrThrow(request.group)
  if (toId(group.creator) !== String(userId)) {
    const error = new Error('Only the group creator can accept join requests.')
    error.statusCode = 403
    throw error
  }

  if (request.status !== 'pending') {
    const error = new Error('This join request has already been reviewed.')
    error.statusCode = 400
    throw error
  }

  if (!PUBLIC_GROUP_STATUSES.includes(group.status)) {
    const error = new Error('This group is not accepting members now.')
    error.statusCode = 400
    throw error
  }

  const acceptedCount = await RoommateGroupMember.countDocuments({ group: group._id, status: 'accepted' })
  if (acceptedCount >= group.targetGroupSize) {
    const error = new Error('This roommate group is already full.')
    error.statusCode = 400
    throw error
  }

  const now = new Date()
  request.status = 'accepted'
  request.decidedBy = userId
  request.decidedAt = now
  await request.save()

  await RoommateGroupMember.create({
    group: group._id,
    user: request.applicant._id || request.applicant,
    memberType: 'unknown_approved',
    status: 'accepted',
    addedBy: userId,
    tenantSnapshot: request.applicantSnapshot || buildTenantSnapshot(request.applicant, {}),
    expectedContribution: request.expectedContribution ?? group.rentPerPerson,
    joinedAt: now
  })

  await createNotification({
    userId: request.applicant._id || request.applicant,
    actorId: userId,
    title: 'Roommate request accepted',
    body: `${group.creator?.name || 'The host'} accepted your roommate request for ${group.property?.title || 'this property'}.`,
    type: 'application',
    relatedEntityType: 'roommateGroup',
    relatedEntityId: group._id,
    actionUrl: `/roommate-groups/${group._id}`,
    priority: 'high'
  })

  await notifyGroupMembers(group._id, {
    actorId: userId,
    title: 'New roommate joined',
    body: `${request.applicantSnapshot?.name || request.applicant?.name || 'A tenant'} joined your roommate group for ${group.property?.title || 'this property'}.`,
    type: 'application',
    relatedEntityType: 'roommateGroup',
    relatedEntityId: group._id,
    actionUrl: `/roommate-groups/${group._id}`,
    priority: 'normal'
  }, [request.applicant._id || request.applicant])

  return refreshAndSubmitIfReady(group._id)
}

export async function rejectJoinRequest({ requestId, userId }) {
  const request = await RoommateJoinRequest.findById(requestId)
  if (!request) {
    const error = new Error('Join request not found.')
    error.statusCode = 404
    throw error
  }

  const group = await getGroupOrThrow(request.group)
  if (toId(group.creator) !== String(userId)) {
    const error = new Error('Only the group creator can reject join requests.')
    error.statusCode = 403
    throw error
  }

  if (request.status !== 'pending') {
    const error = new Error('This join request has already been reviewed.')
    error.statusCode = 400
    throw error
  }

  request.status = 'rejected'
  request.decidedBy = userId
  request.decidedAt = new Date()
  await request.save()

  await createNotification({
    userId: request.applicant,
    actorId: userId,
    title: 'Roommate request not accepted',
    body: `Your request to join ${group.property?.title || 'this property'} was not accepted.`,
    type: 'application',
    relatedEntityType: 'roommateGroup',
    relatedEntityId: group._id,
    actionUrl: `/roommate-groups/${group._id}`,
    priority: 'normal'
  })

  return request
}

export async function respondToInvitation({ memberId, userId, response }) {
  const member = await RoommateGroupMember.findById(memberId)
  if (!member) {
    const error = new Error('Invitation not found.')
    error.statusCode = 404
    throw error
  }

  if (toId(member.user) !== String(userId)) {
    const error = new Error('You can only respond to your own roommate invitation.')
    error.statusCode = 403
    throw error
  }

  if (member.status !== 'pending_invitation') {
    const error = new Error('This invitation has already been answered.')
    error.statusCode = 400
    throw error
  }

  const group = await getGroupOrThrow(member.group)
  if (group.status === 'sent_to_manager') {
    const error = new Error('This group has already been sent to the manager.')
    error.statusCode = 400
    throw error
  }

  if (response === 'accept' || response === 'accepted') {
    member.status = 'accepted'
    member.joinedAt = new Date()
    await member.save()

    await createNotification({
      userId: group.creator._id || group.creator,
      actorId: userId,
      title: 'Roommate invitation accepted',
      body: `${member.tenantSnapshot?.name || 'A roommate'} accepted your invitation for ${group.property?.title || 'this property'}.`,
      type: 'application',
      relatedEntityType: 'roommateGroup',
      relatedEntityId: group._id,
      actionUrl: `/roommate-groups/${group._id}`,
      priority: 'normal'
    })
  } else {
    member.status = 'declined'
    await member.save()

    await createNotification({
      userId: group.creator._id || group.creator,
      actorId: userId,
      title: 'Roommate invitation declined',
      body: `${member.tenantSnapshot?.name || 'A roommate'} declined your invitation for ${group.property?.title || 'this property'}.`,
      type: 'application',
      relatedEntityType: 'roommateGroup',
      relatedEntityId: group._id,
      actionUrl: `/roommate-groups/${group._id}`,
      priority: 'normal'
    })
  }

  return refreshAndSubmitIfReady(group._id)
}

export async function leaveRoommateGroup({ groupId, userId }) {
  const group = await getGroupOrThrow(groupId)
  if (['sent_to_manager', 'manager_approved', 'manager_rejected'].includes(group.status)) {
    const error = new Error('This group has already been sent to the manager. Contact the manager or creator instead.')
    error.statusCode = 400
    throw error
  }

  if (toId(group.creator) === String(userId)) {
    const error = new Error('Creators should cancel the group instead of leaving it.')
    error.statusCode = 400
    throw error
  }

  const member = await RoommateGroupMember.findOne({ group: group._id, user: userId, status: { $in: ['accepted', 'pending_invitation'] } })
  if (!member) {
    const error = new Error('You are not an active member of this group.')
    error.statusCode = 404
    throw error
  }

  member.status = member.status === 'pending_invitation' ? 'declined' : 'left'
  await member.save()

  await createNotification({
    userId: group.creator._id || group.creator,
    actorId: userId,
    title: 'Roommate left group',
    body: `${member.tenantSnapshot?.name || 'A roommate'} left your roommate group for ${group.property?.title || 'this property'}.`,
    type: 'application',
    relatedEntityType: 'roommateGroup',
    relatedEntityId: group._id,
    actionUrl: `/roommate-groups/${group._id}`,
    priority: 'normal'
  })

  return refreshGroupCounts(group._id)
}

export async function cancelRoommateGroup({ groupId, userId }) {
  const group = await getGroupOrThrow(groupId)
  if (toId(group.creator) !== String(userId)) {
    const error = new Error('Only the group creator can cancel this roommate group.')
    error.statusCode = 403
    throw error
  }

  if (['sent_to_manager', 'manager_approved'].includes(group.status)) {
    const error = new Error('This group has already been sent to the manager and cannot be cancelled here.')
    error.statusCode = 400
    throw error
  }

  group.status = 'cancelled'
  await group.save()
  await RoommateJoinRequest.updateMany({ group: group._id, status: 'pending' }, { $set: { status: 'cancelled' } })

  await notifyGroupMembers(group._id, {
    actorId: userId,
    title: 'Roommate group cancelled',
    body: `The roommate group for ${group.property?.title || 'this property'} was cancelled.`,
    type: 'application',
    relatedEntityType: 'roommateGroup',
    relatedEntityId: group._id,
    actionUrl: `/roommate-groups/${group._id}`,
    priority: 'normal',
    skipActor: false
  })

  return group
}

export async function handleSharedPropertyRequestDecision({ request, status, managerId }) {
  if (request.applicationMode !== 'roommate_group' || !request.roommateGroup) return

  const group = await RoommateGroup.findById(request.roommateGroup).populate('property', 'title').populate('creator', 'name')
  if (!group) return

  group.status = status === 'approved' ? 'manager_approved' : 'manager_rejected'
  await group.save()

  const members = await RoommateGroupMember.find({ group: group._id, status: 'accepted', user: { $ne: null } })
    .populate('user', 'name email phone applicationProfile')
    .lean()

  if (status === 'approved') {
    for (const member of members) {
      await TenantPropertyRecord.findOneAndUpdate(
        { sourceRequest: request._id, tenant: member.user._id || member.user },
        {
          property: request.property,
          tenant: member.user._id || member.user,
          manager: request.manager,
          sourceRequest: request._id,
          actionType: request.actionType,
          occupancyStatus: request.occupancyStatus || 'active',
          leaseMonths: request.pricing?.leaseMonths ?? null,
          pricing: {
            monthlyRent: request.pricing?.monthlyRent ?? null,
            salePrice: request.pricing?.salePrice ?? null,
            totalCost: request.pricing?.totalCost ?? null
          },
          approvedAt: request.reviewedAt || new Date(),
          occupancyUpdatedAt: request.occupancyUpdatedAt || request.reviewedAt || new Date()
        },
        { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
      )
    }
  }

  await createBulkNotificationsForUsers(members.map((member) => member.user._id || member.user), {
    actorId: managerId,
    title: status === 'approved' ? 'Shared application approved' : 'Shared application rejected',
    body: status === 'approved'
      ? `Your shared ${request.actionType} application for ${group.property?.title || 'this property'} was approved.`
      : `Your shared application for ${group.property?.title || 'this property'} was rejected.`,
    type: 'application',
    relatedEntityType: 'propertyRequest',
    relatedEntityId: request._id,
    actionUrl: `/property-requests/${request._id}`,
    priority: status === 'approved' ? 'high' : 'normal',
    skipActor: false
  })
}
