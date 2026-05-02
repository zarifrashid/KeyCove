import RoommateGroup from '../models/RoommateGroup.js'
import RoommateGroupMember from '../models/RoommateGroupMember.js'
import RoommateJoinRequest from '../models/RoommateJoinRequest.js'
import User from '../models/User.js'
import {
  acceptJoinRequest,
  cancelRoommateGroup,
  createJoinRequest,
  createRoommateGroup,
  leaveRoommateGroup,
  mapRoommateGroup,
  rejectJoinRequest,
  respondToInvitation
} from '../services/roommates/roommateGroupService.js'

function toId(value) {
  return value?._id?.toString?.() || value?.toString?.() || ''
}

function handleControllerError(error, res, fallback = 'Roommate group action failed.') {
  return res.status(error.statusCode || 500).json({ message: error.message || fallback })
}

async function getViewerMembershipState(groupId, userId) {
  const [member, request] = await Promise.all([
    RoommateGroupMember.findOne({ group: groupId, user: userId, status: { $in: ['accepted', 'pending_invitation'] } }).lean(),
    RoommateJoinRequest.findOne({ group: groupId, applicant: userId }).sort({ createdAt: -1 }).lean()
  ])

  return {
    memberStatus: member?.status || '',
    memberId: member?._id || null,
    joinRequestStatus: request?.status || '',
    joinRequestId: request?._id || null,
    alreadyApplied: request?.status === 'pending'
  }
}

export async function searchTenantRoommates(req, res) {
  try {
    const query = String(req.query.q || '').trim()
    if (!query || query.length < 2) {
      return res.status(200).json({ success: true, tenants: [] })
    }

    const tenants = await User.find({
      role: 'tenant',
      accountStatus: { $ne: 'deleted' },
      _id: { $ne: req.user.userId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('name email phone applicationProfile createdAt')
      .limit(10)
      .lean()

    res.status(200).json({
      success: true,
      tenants: tenants.map((tenant) => ({
        _id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        occupation: tenant.applicationProfile?.occupation || '',
        employmentStatus: tenant.applicationProfile?.employmentStatus || '',
        joinedAt: tenant.createdAt
      }))
    })
  } catch (error) {
    handleControllerError(error, res, 'Failed to search tenants.')
  }
}

export async function listPropertyRoommateGroups(req, res) {
  try {
    const { propertyId } = req.params
    const actionType = String(req.query.type || '').toLowerCase()
    const filter = {
      property: propertyId,
      status: { $in: ['open', 'waiting_for_known_roommates'] },
      applicationMode: 'unknown_roommate_search'
    }

    if (['rent', 'lease'].includes(actionType)) filter.actionType = actionType

    const groups = await RoommateGroup.find(filter)
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('creator', 'name email phone role applicationProfile createdAt')
      .sort({ createdAt: -1 })
      .lean()

    const mapped = []
    for (const group of groups) {
      const mappedGroup = await mapRoommateGroup(group, req.user)
      const state = await getViewerMembershipState(group._id, req.user.userId)
      mapped.push({ ...mappedGroup, viewerState: { ...mappedGroup.viewerState, ...state } })
    }

    res.status(200).json({ success: true, groups: mapped })
  } catch (error) {
    handleControllerError(error, res, 'Failed to load roommate groups.')
  }
}

export async function createRoommateGroupController(req, res) {
  try {
    const group = await createRoommateGroup({
      userId: req.user.userId,
      payload: req.body || {},
      currentUser: req.user
    })

    const fullGroup = await RoommateGroup.findById(group._id)
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('creator', 'name email phone role applicationProfile createdAt')
      .populate('manager', 'name email phone role companyName')
      .lean()

    res.status(201).json({
      success: true,
      message: 'Roommate group created successfully.',
      group: await mapRoommateGroup(fullGroup, req.user, { includeJoinRequests: true })
    })
  } catch (error) {
    handleControllerError(error, res, 'Failed to create roommate group.')
  }
}

export async function getMyRoommateGroups(req, res) {
  try {
    const userId = req.user.userId
    const [createdGroups, memberRecords, joinRequests, invitations] = await Promise.all([
      RoommateGroup.find({ creator: userId })
        .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
        .populate('creator', 'name email phone role applicationProfile createdAt')
        .populate('manager', 'name email phone role companyName')
        .sort({ createdAt: -1 })
        .lean(),
      RoommateGroupMember.find({ user: userId, status: 'accepted', memberType: { $ne: 'creator' } }).select('group').lean(),
      RoommateJoinRequest.find({ applicant: userId })
        .populate({ path: 'group', populate: [
          { path: 'property', select: 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet' },
          { path: 'creator', select: 'name email phone role applicationProfile createdAt' }
        ] })
        .sort({ createdAt: -1 })
        .lean(),
      RoommateGroupMember.find({ user: userId, status: 'pending_invitation' })
        .populate({ path: 'group', populate: [
          { path: 'property', select: 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet' },
          { path: 'creator', select: 'name email phone role applicationProfile createdAt' }
        ] })
        .sort({ createdAt: -1 })
        .lean()
    ])

    const memberGroupIds = memberRecords.map((record) => record.group).filter(Boolean)
    const memberGroups = memberGroupIds.length
      ? await RoommateGroup.find({ _id: { $in: memberGroupIds } })
        .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
        .populate('creator', 'name email phone role applicationProfile createdAt')
        .populate('manager', 'name email phone role companyName')
        .sort({ createdAt: -1 })
        .lean()
      : []

    const mapCreated = []
    for (const group of createdGroups) {
      mapCreated.push(await mapRoommateGroup(group, req.user, { includeJoinRequests: true }))
    }

    const mapMember = []
    for (const group of memberGroups) {
      mapMember.push(await mapRoommateGroup(group, req.user))
    }

    res.status(200).json({
      success: true,
      createdGroups: mapCreated,
      memberGroups: mapMember,
      sentJoinRequests: joinRequests.map((request) => ({
        _id: request._id,
        status: request.status,
        introMessage: request.introMessage,
        lifestyleNote: request.lifestyleNote,
        expectedContribution: request.expectedContribution,
        createdAt: request.createdAt,
        group: request.group
      })),
      invitations: invitations.map((invitation) => ({
        _id: invitation._id,
        status: invitation.status,
        relationshipToCreator: invitation.relationshipToCreator,
        expectedContribution: invitation.expectedContribution,
        createdAt: invitation.createdAt,
        group: invitation.group
      }))
    })
  } catch (error) {
    handleControllerError(error, res, 'Failed to load your roommate groups.')
  }
}

export async function getRoommateGroupDetails(req, res) {
  try {
    const group = await RoommateGroup.findById(req.params.groupId)
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('creator', 'name email phone role applicationProfile createdAt')
      .populate('manager', 'name email phone role companyName')
      .lean()

    if (!group) return res.status(404).json({ message: 'Roommate group not found.' })

    const viewerId = req.user.userId
    const isManager = toId(group.manager) === viewerId
    const isCreator = toId(group.creator) === viewerId
    const member = await RoommateGroupMember.findOne({ group: group._id, user: viewerId, status: { $in: ['accepted', 'pending_invitation'] } }).lean()

    if (req.user.role === 'manager' && !isManager) {
      return res.status(403).json({ message: 'You can only view groups for your own properties.' })
    }

    const includeJoinRequests = Boolean(isCreator || isManager || req.user.role === 'admin')
    const mapped = await mapRoommateGroup(group, req.user, { includeJoinRequests })
    const state = await getViewerMembershipState(group._id, viewerId)

    res.status(200).json({
      success: true,
      group: {
        ...mapped,
        viewerState: {
          ...mapped.viewerState,
          ...state,
          isInvited: member?.status === 'pending_invitation'
        }
      }
    })
  } catch (error) {
    handleControllerError(error, res, 'Failed to load roommate group details.')
  }
}

export async function createJoinRequestController(req, res) {
  try {
    const request = await createJoinRequest({
      groupId: req.params.groupId,
      userId: req.user.userId,
      payload: req.body || {},
      currentUser: req.user
    })

    res.status(201).json({
      success: true,
      message: 'Your request was sent to the group creator. You will be notified when they accept or reject it.',
      request
    })
  } catch (error) {
    handleControllerError(error, res, 'Failed to send join request.')
  }
}

export async function acceptJoinRequestController(req, res) {
  try {
    const group = await acceptJoinRequest({ requestId: req.params.requestId, userId: req.user.userId })
    const fullGroup = await RoommateGroup.findById(group._id)
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('creator', 'name email phone role applicationProfile createdAt')
      .populate('manager', 'name email phone role companyName')
      .lean()

    res.status(200).json({
      success: true,
      message: 'Applicant accepted successfully.',
      group: await mapRoommateGroup(fullGroup, req.user, { includeJoinRequests: true })
    })
  } catch (error) {
    handleControllerError(error, res, 'Failed to accept join request.')
  }
}

export async function rejectJoinRequestController(req, res) {
  try {
    await rejectJoinRequest({ requestId: req.params.requestId, userId: req.user.userId })
    res.status(200).json({ success: true, message: 'Applicant rejected successfully.' })
  } catch (error) {
    handleControllerError(error, res, 'Failed to reject join request.')
  }
}

export async function respondInvitationController(req, res) {
  try {
    const response = req.body?.response || req.body?.status
    const group = await respondToInvitation({
      memberId: req.params.memberId,
      userId: req.user.userId,
      response
    })

    res.status(200).json({
      success: true,
      message: response === 'accept' || response === 'accepted' ? 'Invitation accepted.' : 'Invitation declined.',
      group
    })
  } catch (error) {
    handleControllerError(error, res, 'Failed to respond to invitation.')
  }
}

export async function leaveRoommateGroupController(req, res) {
  try {
    const group = await leaveRoommateGroup({ groupId: req.params.groupId, userId: req.user.userId })
    res.status(200).json({ success: true, message: 'You left the roommate group.', group })
  } catch (error) {
    handleControllerError(error, res, 'Failed to leave roommate group.')
  }
}

export async function cancelRoommateGroupController(req, res) {
  try {
    const group = await cancelRoommateGroup({ groupId: req.params.groupId, userId: req.user.userId })
    res.status(200).json({ success: true, message: 'Roommate group cancelled.', group })
  } catch (error) {
    handleControllerError(error, res, 'Failed to cancel roommate group.')
  }
}

export async function getManagerRoommateGroups(req, res) {
  try {
    const groups = await RoommateGroup.find({ manager: req.user.userId })
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('creator', 'name email phone role applicationProfile createdAt')
      .populate('manager', 'name email phone role companyName')
      .sort({ createdAt: -1 })
      .lean()

    const mapped = []
    for (const group of groups) {
      mapped.push(await mapRoommateGroup(group, req.user, { includeJoinRequests: true }))
    }

    res.status(200).json({ success: true, groups: mapped })
  } catch (error) {
    handleControllerError(error, res, 'Failed to load manager roommate groups.')
  }
}
