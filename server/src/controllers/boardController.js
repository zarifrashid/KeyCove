import mongoose from 'mongoose'
import SharedBoard from '../models/SharedBoard.js'
import BoardMember from '../models/BoardMember.js'
import BoardItem from '../models/BoardItem.js'
import BoardComment from '../models/BoardComment.js'
import Vote from '../models/Vote.js'
import BoardNotification from '../models/BoardNotification.js'
import Property from '../models/Property.js'
import User from '../models/User.js'
import { emitBoardEventToUsers, registerBoardStream, removeBoardStream } from '../services/boards/realtime.js'
import { isBoardOwner, requireBoardAccess, userIdsMatch } from '../utils/boardAccess.js'

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function mapUser(user) {
  if (!user) return null
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  }
}

function mapProperty(property) {
  if (!property) return null
  return {
    _id: property._id,
    title: property.title,
    description: property.description,
    price: property.price,
    rentPrice: property.rentPrice,
    salePrice: property.salePrice,
    listingType: property.listingType,
    propertyType: property.propertyType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFeet,
    image: property.image,
    images: property.images,
    imageAlt: property.imageAlt,
    status: property.status,
    location: property.location,
    manager: property.manager ? mapUser(property.manager) : null,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt
  }
}

function mapMember(member) {
  return {
    _id: member._id,
    board: member.board,
    user: mapUser(member.user),
    role: member.role,
    status: member.status,
    invitedBy: member.invitedBy ? mapUser(member.invitedBy) : null,
    invitedAt: member.invitedAt,
    joinedAt: member.joinedAt,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt
  }
}

function mapComment(comment) {
  return {
    _id: comment._id,
    boardItem: comment.boardItem,
    user: mapUser(comment.user),
    text: comment.text,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
  }
}

function mapNotification(notification) {
  return {
    _id: notification._id,
    user: notification.user,
    board: notification.board,
    actor: mapUser(notification.actor),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  }
}

function summarizeVotes(votes, viewerId) {
  const summary = {
    upvoteCount: 0,
    downvoteCount: 0,
    score: 0,
    viewerVote: null
  }

  votes.forEach((vote) => {
    if (vote.voteType === 'upvote') summary.upvoteCount += 1
    if (vote.voteType === 'downvote') summary.downvoteCount += 1
    if (vote.voteType === 'upvote') summary.score += 1
    if (vote.voteType === 'downvote') summary.score -= 1
    if (userIdsMatch(vote.user?._id || vote.user, viewerId)) {
      summary.viewerVote = vote.voteType
    }
  })

  return summary
}

async function touchBoard(boardId) {
  await SharedBoard.findByIdAndUpdate(boardId, { $set: { lastActivityAt: new Date() } })
}

async function getAcceptedMemberIds(boardId) {
  const members = await BoardMember.find({ board: boardId, status: 'accepted' }).select('user')
  return members.map((item) => item.user?.toString()).filter(Boolean)
}

async function createNotifications({ boardId, recipients, actorId = null, type, title, body = '', relatedEntityType = '', relatedEntityId = null }) {
  const uniqueRecipients = [...new Set((recipients || []).map((item) => String(item)).filter(Boolean))]
  if (!uniqueRecipients.length) return []

  const notifications = await BoardNotification.insertMany(
    uniqueRecipients.map((userId) => ({
      user: userId,
      board: boardId,
      actor: actorId,
      type,
      title,
      body,
      relatedEntityType,
      relatedEntityId
    }))
  )

  emitBoardEventToUsers(uniqueRecipients, 'board:activityUpdated', {
    boardId: String(boardId),
    type,
    timestamp: new Date().toISOString()
  })

  return notifications
}

async function getUnreadInvitationCount(userId) {
  return BoardMember.countDocuments({ user: userId, status: 'pending' })
}

async function getUnreadActivityCount(userId) {
  return BoardNotification.countDocuments({ user: userId, isRead: false })
}

async function emitBoardSummary(userIds) {
  const uniqueUsers = [...new Set((userIds || []).map((item) => String(item)).filter(Boolean))]
  for (const userId of uniqueUsers) {
    const [pendingInvites, unreadActivity] = await Promise.all([
      getUnreadInvitationCount(userId),
      getUnreadActivityCount(userId)
    ])

    emitBoardEventToUsers([userId], 'board:summaryUpdated', {
      pendingInvites,
      unreadActivity
    })
  }
}

async function buildBoardPayload(boardId, viewerId) {
  const board = await SharedBoard.findById(boardId)
    .populate('owner', 'name email role')
    .populate('coverProperty', 'title image images location price listingType propertyType bedrooms bathrooms squareFeet status')

  if (!board) return null

  const [members, items, notifications] = await Promise.all([
    BoardMember.find({ board: boardId })
      .populate('user', 'name email role')
      .populate('invitedBy', 'name email role')
      .sort({ role: 1, status: 1, joinedAt: 1, invitedAt: 1 }),
    BoardItem.find({ board: boardId })
      .populate({ path: 'property', populate: { path: 'manager', select: 'name email role' } })
      .populate('addedBy', 'name email role')
      .sort({ addedAt: -1, createdAt: -1 }),
    BoardNotification.find({ user: viewerId, board: boardId })
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(40)
  ])

  const itemIds = items.map((item) => item._id)
  const [comments, votes] = await Promise.all([
    BoardComment.find({ boardItem: { $in: itemIds } })
      .populate('user', 'name email role')
      .sort({ createdAt: 1 }),
    Vote.find({ boardItem: { $in: itemIds } })
      .populate('user', 'name email role')
      .sort({ createdAt: 1 })
  ])

  const commentsByItem = new Map()
  comments.forEach((comment) => {
    const key = String(comment.boardItem)
    if (!commentsByItem.has(key)) commentsByItem.set(key, [])
    commentsByItem.get(key).push(comment)
  })

  const votesByItem = new Map()
  votes.forEach((vote) => {
    const key = String(vote.boardItem)
    if (!votesByItem.has(key)) votesByItem.set(key, [])
    votesByItem.get(key).push(vote)
  })

  const mappedItems = items.map((item) => {
    const itemComments = commentsByItem.get(String(item._id)) || []
    const itemVotes = votesByItem.get(String(item._id)) || []

    return {
      _id: item._id,
      board: item.board,
      property: mapProperty(item.property),
      addedBy: mapUser(item.addedBy),
      note: item.note,
      addedAt: item.addedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      comments: itemComments.map(mapComment),
      votes: summarizeVotes(itemVotes, viewerId)
    }
  })

  const acceptedMembers = members.filter((member) => member.status === 'accepted')
  const pendingMembers = members.filter((member) => member.status === 'pending')
  const declinedMembers = members.filter((member) => member.status === 'declined')

  return {
    board: {
      _id: board._id,
      title: board.title,
      description: board.description,
      owner: mapUser(board.owner),
      coverProperty: mapProperty(board.coverProperty),
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      lastActivityAt: board.lastActivityAt,
      acceptedMemberCount: acceptedMembers.length,
      pendingMemberCount: pendingMembers.length,
      propertyCount: mappedItems.length,
      unreadActivityCount: notifications.filter((item) => !item.isRead).length
    },
    members: members.map(mapMember),
    acceptedMembers: acceptedMembers.map(mapMember),
    pendingMembers: pendingMembers.map(mapMember),
    declinedMembers: declinedMembers.map(mapMember),
    items: mappedItems,
    notifications: notifications.map(mapNotification)
  }
}

export function streamBoardEvents(req, res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  registerBoardStream(req.user.userId, res)

  const keepAlive = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`)
  }, 25000)

  req.on('close', () => {
    clearInterval(keepAlive)
    removeBoardStream(req.user.userId, res)
    res.end()
  })
}

export async function getBoardSummary(req, res) {
  try {
    const [pendingInvites, unreadActivity] = await Promise.all([
      getUnreadInvitationCount(req.user.userId),
      getUnreadActivityCount(req.user.userId)
    ])

    res.status(200).json({ pendingInvites, unreadActivity })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load board summary.' })
  }
}

export async function getMyBoards(req, res) {
  try {
    const acceptedMemberships = await BoardMember.find({ user: req.user.userId, status: 'accepted' }).select('board role status joinedAt')
    const boardIds = acceptedMemberships.map((item) => item.board)

    const [boards, pendingInvites, unreadActivity] = await Promise.all([
      SharedBoard.find({ _id: { $in: boardIds } })
        .populate('owner', 'name email role')
        .populate('coverProperty', 'title image images location price listingType propertyType bedrooms bathrooms squareFeet status')
        .sort({ lastActivityAt: -1, updatedAt: -1 }),
      getUnreadInvitationCount(req.user.userId),
      getUnreadActivityCount(req.user.userId)
    ])

    const boardIdStrings = boards.map((board) => String(board._id))
    const [memberCounts, itemCounts, unreadByBoard] = await Promise.all([
      BoardMember.aggregate([
        { $match: { board: { $in: boards.map((board) => board._id) }, status: 'accepted' } },
        { $group: { _id: '$board', count: { $sum: 1 } } }
      ]),
      BoardItem.aggregate([
        { $match: { board: { $in: boards.map((board) => board._id) } } },
        { $group: { _id: '$board', count: { $sum: 1 } } }
      ]),
      BoardNotification.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user.userId), board: { $in: boards.map((board) => board._id) }, isRead: false } },
        { $group: { _id: '$board', count: { $sum: 1 } } }
      ])
    ])

    const memberCountMap = new Map(memberCounts.map((item) => [String(item._id), item.count]))
    const itemCountMap = new Map(itemCounts.map((item) => [String(item._id), item.count]))
    const unreadCountMap = new Map(unreadByBoard.map((item) => [String(item._id), item.count]))
    const membershipMap = new Map(acceptedMemberships.map((item) => [String(item.board), item]))

    res.status(200).json({
      boards: boards.map((board) => ({
        _id: board._id,
        title: board.title,
        description: board.description,
        owner: mapUser(board.owner),
        coverProperty: mapProperty(board.coverProperty),
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        lastActivityAt: board.lastActivityAt,
        memberCount: memberCountMap.get(String(board._id)) || 0,
        propertyCount: itemCountMap.get(String(board._id)) || 0,
        unreadActivityCount: unreadCountMap.get(String(board._id)) || 0,
        membershipRole: membershipMap.get(String(board._id))?.role || 'member'
      })),
      pendingInvites,
      unreadActivity,
      boardIds: boardIdStrings
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load boards.' })
  }
}

export async function searchTenantUsers(req, res) {
  try {
    const query = normalizeString(req.query?.q)
    if (query.length < 2) {
      return res.status(200).json({ users: [] })
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const users = await User.find({
      role: 'tenant',
      _id: { $ne: req.user.userId },
      $or: [{ name: regex }, { email: regex }]
    })
      .select('name email role')
      .sort({ name: 1 })
      .limit(8)

    res.status(200).json({ users: users.map(mapUser) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to search users.' })
  }
}

export async function createBoard(req, res) {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can create shared boards.' })
    }

    const title = normalizeString(req.body?.title)
    const description = normalizeString(req.body?.description)
    const addPropertyId = req.body?.addPropertyId || null

    if (!title) {
      return res.status(400).json({ message: 'Board title is required.' })
    }

    const board = await SharedBoard.create({
      title,
      description,
      owner: req.user.userId,
      lastActivityAt: new Date()
    })

    await BoardMember.create({
      board: board._id,
      user: req.user.userId,
      role: 'owner',
      status: 'accepted',
      invitedBy: req.user.userId,
      invitedAt: new Date(),
      joinedAt: new Date()
    })

    let boardItem = null
    if (addPropertyId) {
      const property = await Property.findById(addPropertyId).populate('manager', 'name email role')
      if (!property || property.status === 'deleted') {
        return res.status(404).json({ message: 'Property not found for board creation.' })
      }

      boardItem = await BoardItem.create({
        board: board._id,
        property: property._id,
        addedBy: req.user.userId,
        addedAt: new Date()
      })

      board.coverProperty = property._id
      board.lastActivityAt = new Date()
      await board.save()
    }

    await createNotifications({
      boardId: board._id,
      recipients: [req.user.userId],
      actorId: req.user.userId,
      type: 'board_created',
      title: 'Shared board created',
      body: boardItem ? 'Your first property was added to the new board.' : 'You can now invite members and add properties.',
      relatedEntityType: 'board',
      relatedEntityId: board._id
    })

    await emitBoardSummary([req.user.userId])
    const payload = await buildBoardPayload(board._id, req.user.userId)
    res.status(201).json(payload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create board.' })
  }
}

export async function getBoardDetails(req, res) {
  try {
    const access = await requireBoardAccess(req.params.boardId, req.user.userId)
    if (!access.board) {
      return res.status(404).json({ message: 'Board not found.' })
    }
    if (!access.allowed) {
      return res.status(403).json({ message: 'You cannot access this board.' })
    }

    const payload = await buildBoardPayload(access.board._id, req.user.userId)
    res.status(200).json(payload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load board details.' })
  }
}

export async function inviteBoardMember(req, res) {
  try {
    const access = await requireBoardAccess(req.params.boardId, req.user.userId)
    if (!access.board) {
      return res.status(404).json({ message: 'Board not found.' })
    }
    if (!access.allowed || !isBoardOwner(access.board, access.membership, req.user.userId)) {
      return res.status(403).json({ message: 'Only the board owner can invite members.' })
    }

    const inviteeId = req.body?.userId
    if (!inviteeId) {
      return res.status(400).json({ message: 'Invitee user id is required.' })
    }

    if (String(inviteeId) === String(req.user.userId)) {
      return res.status(400).json({ message: 'You are already on this board.' })
    }

    const invitee = await User.findById(inviteeId).select('name email role')
    if (!invitee || invitee.role !== 'tenant') {
      return res.status(404).json({ message: 'Tenant not found.' })
    }

    let membership = await BoardMember.findOne({ board: access.board._id, user: invitee._id })

    if (membership?.status === 'accepted') {
      return res.status(400).json({ message: 'This member is already part of the board.' })
    }

    if (!membership) {
      membership = await BoardMember.create({
        board: access.board._id,
        user: invitee._id,
        role: 'member',
        status: 'pending',
        invitedBy: req.user.userId,
        invitedAt: new Date(),
        joinedAt: null
      })
    } else {
      membership.status = 'pending'
      membership.invitedBy = req.user.userId
      membership.invitedAt = new Date()
      membership.joinedAt = null
      await membership.save()
    }

    access.board.lastActivityAt = new Date()
    await access.board.save()

    await createNotifications({
      boardId: access.board._id,
      recipients: [invitee._id],
      actorId: req.user.userId,
      type: 'invite',
      title: `${req.user.name} invited you to ${access.board.title}`,
      body: 'Open Shared Search to accept or decline this board invitation.',
      relatedEntityType: 'boardMember',
      relatedEntityId: membership._id
    })

    emitBoardEventToUsers([invitee._id], 'board:inviteReceived', {
      boardId: String(access.board._id),
      membershipId: String(membership._id)
    })
    await emitBoardSummary([invitee._id, req.user.userId])

    const payload = await buildBoardPayload(access.board._id, req.user.userId)
    res.status(201).json(payload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to invite member.' })
  }
}

export async function getPendingInvitations(req, res) {
  try {
    const memberships = await BoardMember.find({ user: req.user.userId, status: 'pending' })
      .populate({ path: 'board', populate: { path: 'owner', select: 'name email role' } })
      .populate('invitedBy', 'name email role')
      .sort({ invitedAt: -1, createdAt: -1 })

    res.status(200).json({
      invitations: memberships.map((membership) => ({
        _id: membership._id,
        board: membership.board
          ? {
              _id: membership.board._id,
              title: membership.board.title,
              description: membership.board.description,
              owner: mapUser(membership.board.owner),
              createdAt: membership.board.createdAt,
              updatedAt: membership.board.updatedAt,
              lastActivityAt: membership.board.lastActivityAt
            }
          : null,
        invitedBy: mapUser(membership.invitedBy),
        invitedAt: membership.invitedAt,
        status: membership.status,
        role: membership.role
      }))
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load invitations.' })
  }
}

export async function respondToInvitation(req, res) {
  try {
    const response = normalizeString(req.body?.response).toLowerCase()
    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ message: 'Response must be accepted or declined.' })
    }

    const membership = await BoardMember.findById(req.params.memberId)
      .populate({ path: 'board', populate: { path: 'owner', select: 'name email role' } })
      .populate('user', 'name email role')
      .populate('invitedBy', 'name email role')

    if (!membership || !membership.board) {
      return res.status(404).json({ message: 'Invitation not found.' })
    }

    if (!userIdsMatch(membership.user?._id || membership.user, req.user.userId)) {
      return res.status(403).json({ message: 'You cannot respond to this invitation.' })
    }

    membership.status = response
    membership.joinedAt = response === 'accepted' ? new Date() : null
    await membership.save()

    await touchBoard(membership.board._id)

    const acceptedMemberIds = await getAcceptedMemberIds(membership.board._id)
    const notificationType = response === 'accepted' ? 'invite_accepted' : 'invite_declined'
    const body = response === 'accepted'
      ? `${membership.user.name} joined the board.`
      : `${membership.user.name} declined the board invitation.`

    await createNotifications({
      boardId: membership.board._id,
      recipients: [...acceptedMemberIds, membership.board.owner?._id || membership.board.owner],
      actorId: req.user.userId,
      type: notificationType,
      title: response === 'accepted' ? 'Board invitation accepted' : 'Board invitation declined',
      body,
      relatedEntityType: 'boardMember',
      relatedEntityId: membership._id
    })

    emitBoardEventToUsers([...acceptedMemberIds, membership.board.owner?._id || membership.board.owner], 'board:inviteUpdated', {
      boardId: String(membership.board._id),
      membershipId: String(membership._id),
      response
    })
    await emitBoardSummary([...acceptedMemberIds, membership.board.owner?._id || membership.board.owner, req.user.userId])

    if (response === 'accepted') {
      const payload = await buildBoardPayload(membership.board._id, req.user.userId)
      return res.status(200).json(payload)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to respond to invitation.' })
  }
}

export async function addBoardItem(req, res) {
  try {
    const access = await requireBoardAccess(req.params.boardId, req.user.userId)
    if (!access.board) return res.status(404).json({ message: 'Board not found.' })
    if (!access.allowed) return res.status(403).json({ message: 'You cannot modify this board.' })

    const propertyId = req.body?.propertyId
    const note = normalizeString(req.body?.note)
    if (!propertyId) {
      return res.status(400).json({ message: 'Property id is required.' })
    }

    const property = await Property.findById(propertyId).populate('manager', 'name email role')
    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found.' })
    }

    let boardItem
    try {
      boardItem = await BoardItem.create({
        board: access.board._id,
        property: property._id,
        addedBy: req.user.userId,
        note,
        addedAt: new Date()
      })
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(400).json({ message: 'This property is already on the board.' })
      }
      throw error
    }

    if (!access.board.coverProperty) {
      access.board.coverProperty = property._id
    }
    access.board.lastActivityAt = new Date()
    await access.board.save()

    const acceptedMemberIds = await getAcceptedMemberIds(access.board._id)
    await createNotifications({
      boardId: access.board._id,
      recipients: acceptedMemberIds,
      actorId: req.user.userId,
      type: 'item_added',
      title: `${req.user.name} added a property`,
      body: property.title,
      relatedEntityType: 'boardItem',
      relatedEntityId: boardItem._id
    })

    emitBoardEventToUsers(acceptedMemberIds, 'board:itemAdded', {
      boardId: String(access.board._id),
      itemId: String(boardItem._id)
    })
    await emitBoardSummary(acceptedMemberIds)

    const payload = await buildBoardPayload(access.board._id, req.user.userId)
    res.status(201).json(payload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to add property to board.' })
  }
}

export async function removeBoardItem(req, res) {
  try {
    const access = await requireBoardAccess(req.params.boardId, req.user.userId)
    if (!access.board) return res.status(404).json({ message: 'Board not found.' })
    if (!access.allowed) return res.status(403).json({ message: 'You cannot modify this board.' })

    const boardItem = await BoardItem.findOne({ _id: req.params.itemId, board: access.board._id }).populate('property', 'title image images location price listingType propertyType bedrooms bathrooms squareFeet status')
    if (!boardItem) {
      return res.status(404).json({ message: 'Board item not found.' })
    }

    await Promise.all([
      BoardComment.deleteMany({ boardItem: boardItem._id }),
      Vote.deleteMany({ boardItem: boardItem._id }),
      BoardItem.deleteOne({ _id: boardItem._id })
    ])

    const acceptedMemberIds = await getAcceptedMemberIds(access.board._id)
    await touchBoard(access.board._id)
    await createNotifications({
      boardId: access.board._id,
      recipients: acceptedMemberIds,
      actorId: req.user.userId,
      type: 'item_removed',
      title: `${req.user.name} removed a property`,
      body: boardItem.property?.title || 'A property was removed from the board.',
      relatedEntityType: 'boardItem',
      relatedEntityId: boardItem._id
    })

    emitBoardEventToUsers(acceptedMemberIds, 'board:boardUpdated', {
      boardId: String(access.board._id),
      itemRemovedId: String(boardItem._id)
    })
    await emitBoardSummary(acceptedMemberIds)

    const remainingItems = await BoardItem.find({ board: access.board._id }).sort({ addedAt: 1 }).limit(1)
    await SharedBoard.findByIdAndUpdate(access.board._id, {
      $set: {
        coverProperty: remainingItems[0]?.property || null,
        lastActivityAt: new Date()
      }
    })

    const payload = await buildBoardPayload(access.board._id, req.user.userId)
    res.status(200).json(payload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove board item.' })
  }
}

async function findAccessibleBoardItem(itemId, userId) {
  const boardItem = await BoardItem.findById(itemId).populate({ path: 'board', populate: { path: 'owner', select: 'name email role' } })
  if (!boardItem || !boardItem.board) return { boardItem: null, access: null }
  const access = await requireBoardAccess(boardItem.board._id, userId)
  return { boardItem, access }
}

export async function addBoardComment(req, res) {
  try {
    const { boardItem, access } = await findAccessibleBoardItem(req.params.itemId, req.user.userId)
    if (!boardItem || !access?.board) return res.status(404).json({ message: 'Board item not found.' })
    if (!access.allowed) return res.status(403).json({ message: 'You cannot comment on this board item.' })

    const text = normalizeString(req.body?.text)
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required.' })
    }

    const comment = await BoardComment.create({
      boardItem: boardItem._id,
      user: req.user.userId,
      text
    })

    await touchBoard(access.board._id)
    const acceptedMemberIds = await getAcceptedMemberIds(access.board._id)
    await createNotifications({
      boardId: access.board._id,
      recipients: acceptedMemberIds,
      actorId: req.user.userId,
      type: 'comment',
      title: `${req.user.name} commented on a property`,
      body: text.slice(0, 120),
      relatedEntityType: 'boardComment',
      relatedEntityId: comment._id
    })

    emitBoardEventToUsers(acceptedMemberIds, 'board:commentAdded', {
      boardId: String(access.board._id),
      itemId: String(boardItem._id),
      commentId: String(comment._id)
    })
    await emitBoardSummary(acceptedMemberIds)

    const payload = await buildBoardPayload(access.board._id, req.user.userId)
    res.status(201).json(payload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to add comment.' })
  }
}

export async function voteBoardItem(req, res) {
  try {
    const { boardItem, access } = await findAccessibleBoardItem(req.params.itemId, req.user.userId)
    if (!boardItem || !access?.board) return res.status(404).json({ message: 'Board item not found.' })
    if (!access.allowed) return res.status(403).json({ message: 'You cannot vote on this board item.' })

    const voteType = normalizeString(req.body?.voteType).toLowerCase()
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Vote type must be upvote or downvote.' })
    }

    const existingVote = await Vote.findOne({ boardItem: boardItem._id, user: req.user.userId })
    if (existingVote && existingVote.voteType === voteType) {
      await Vote.deleteOne({ _id: existingVote._id })
    } else if (existingVote) {
      existingVote.voteType = voteType
      await existingVote.save()
    } else {
      await Vote.create({ boardItem: boardItem._id, user: req.user.userId, voteType })
    }

    await touchBoard(access.board._id)
    const acceptedMemberIds = await getAcceptedMemberIds(access.board._id)
    await createNotifications({
      boardId: access.board._id,
      recipients: acceptedMemberIds,
      actorId: req.user.userId,
      type: 'vote',
      title: `${req.user.name} updated a vote`,
      body: voteType === 'upvote' ? 'The property received an upvote.' : 'The property received a downvote.',
      relatedEntityType: 'boardItem',
      relatedEntityId: boardItem._id
    })

    emitBoardEventToUsers(acceptedMemberIds, 'board:voteUpdated', {
      boardId: String(access.board._id),
      itemId: String(boardItem._id),
      voteType
    })
    await emitBoardSummary(acceptedMemberIds)

    const payload = await buildBoardPayload(access.board._id, req.user.userId)
    res.status(200).json(payload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update vote.' })
  }
}

export async function leaveBoard(req, res) {
  try {
    const access = await requireBoardAccess(req.params.boardId, req.user.userId)
    if (!access.board) return res.status(404).json({ message: 'Board not found.' })
    if (!access.allowed) return res.status(403).json({ message: 'You cannot access this board.' })

    if (isBoardOwner(access.board, access.membership, req.user.userId)) {
      return res.status(400).json({ message: 'Board owners cannot leave their board. Invite another member and transfer ownership in a future upgrade.' })
    }

    access.membership.status = 'left'
    access.membership.joinedAt = null
    await access.membership.save()

    await touchBoard(access.board._id)
    const acceptedMemberIds = await getAcceptedMemberIds(access.board._id)
    await createNotifications({
      boardId: access.board._id,
      recipients: acceptedMemberIds,
      actorId: req.user.userId,
      type: 'member_left',
      title: `${req.user.name} left the board`,
      body: 'The member removed themselves from the shared search group.',
      relatedEntityType: 'boardMember',
      relatedEntityId: access.membership._id
    })

    emitBoardEventToUsers([...acceptedMemberIds, req.user.userId], 'board:boardUpdated', {
      boardId: String(access.board._id),
      memberLeftId: String(req.user.userId)
    })
    await emitBoardSummary([...acceptedMemberIds, req.user.userId])

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to leave board.' })
  }
}

export async function markBoardNotificationsRead(req, res) {
  try {
    const access = await requireBoardAccess(req.params.boardId, req.user.userId)
    if (!access.board) return res.status(404).json({ message: 'Board not found.' })
    if (!access.allowed) return res.status(403).json({ message: 'You cannot access this board.' })

    await BoardNotification.updateMany(
      { board: access.board._id, user: req.user.userId, isRead: false },
      { $set: { isRead: true } }
    )

    await emitBoardSummary([req.user.userId])
    const payload = await buildBoardPayload(access.board._id, req.user.userId)
    res.status(200).json(payload)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to mark board activity as read.' })
  }
}
