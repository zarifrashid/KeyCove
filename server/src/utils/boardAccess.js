import BoardMember from '../models/BoardMember.js'
import SharedBoard from '../models/SharedBoard.js'

export function userIdsMatch(first, second) {
  if (!first || !second) return false
  return String(first) === String(second)
}

export async function getBoardById(boardId) {
  return SharedBoard.findById(boardId).populate('owner', 'name email role')
}

export async function getBoardMemberRecord(boardId, userId) {
  return BoardMember.findOne({ board: boardId, user: userId }).populate('user', 'name email role')
}

export async function isAcceptedBoardMember(boardId, userId) {
  const membership = await BoardMember.findOne({ board: boardId, user: userId, status: 'accepted' })
  return Boolean(membership)
}

export async function requireBoardAccess(boardId, userId) {
  const board = await getBoardById(boardId)
  if (!board) return { board: null, membership: null, allowed: false, reason: 'not_found' }

  const membership = await BoardMember.findOne({ board: boardId, user: userId }).populate('user', 'name email role')
  if (!membership || membership.status !== 'accepted') {
    return { board, membership, allowed: false, reason: 'forbidden' }
  }

  return { board, membership, allowed: true, reason: '' }
}

export function isBoardOwner(board, membership, userId) {
  if (membership?.role === 'owner') return true
  return userIdsMatch(board?.owner?._id || board?.owner, userId)
}
