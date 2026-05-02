import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

const OVERVIEW_LABELS = {
  totalUsers: 'Total Users',
  totalTenants: 'Tenants',
  totalManagers: 'Managers',
  totalAdmins: 'Admins',
  suspendedUsers: 'Suspended Users',
  verifiedManagers: 'Verified Managers',
  pendingVerifications: 'Pending Verifications',
  rejectedVerifications: 'Rejected Verifications',
  activeListings: 'Active Listings',
  draftListings: 'Draft Listings',
  inactiveListings: 'Inactive Listings',
  pendingRequests: 'Pending Requests',
  approvedRequests: 'Approved Requests',
  activeLeases: 'Active Leases',
  conversations: 'Active Conversations',
  savedProperties: 'Saved Properties'
}

const ADMIN_FORM_INITIAL = {
  name: '',
  email: '',
  password: '',
  phone: '',
  department: 'Operations',
  accessLevel: '1'
}

const ANNOUNCEMENT_FORM_INITIAL = {
  title: '',
  message: '',
  targetRole: 'all',
  priority: 'high',
  expiresAt: ''
}

function getUserId(user) {
  return user?._id || user?.id
}

function getStatusClass(status) {
  return `admin-status-pill status-${status || 'active'}`
}

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleString()
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [verifications, setVerifications] = useState([])
  const [roleHistory, setRoleHistory] = useState([])
  const [filters, setFilters] = useState({ search: '', role: '', status: '' })
  const [verificationFilter, setVerificationFilter] = useState('')
  const [adminForm, setAdminForm] = useState(ADMIN_FORM_INITIAL)
  const [announcementForm, setAnnouncementForm] = useState(ANNOUNCEMENT_FORM_INITIAL)
  const [state, setState] = useState({ loading: true, actionId: '', error: '', message: '' })

  const overviewItems = useMemo(() => {
    if (!overview) return []
    return Object.entries(OVERVIEW_LABELS).map(([key, label]) => ({ key, label, value: overview[key] ?? 0 }))
  }, [overview])

  const showMessage = (message) => {
    setState((previous) => ({ ...previous, message, error: '', actionId: '' }))
  }

  const showError = (error, fallback) => {
    setState((previous) => ({ ...previous, error: error.response?.data?.message || fallback, message: '', actionId: '' }))
  }

  const fetchOverview = async () => {
    const { data } = await api.get('/admin/overview')
    setOverview(data.overview || {})
  }

  const fetchUsers = async () => {
    const query = new URLSearchParams()
    if (filters.search) query.set('search', filters.search)
    if (filters.role) query.set('role', filters.role)
    if (filters.status) query.set('status', filters.status)
    query.set('limit', '50')

    const { data } = await api.get(`/admin/users?${query.toString()}`)
    setUsers(data.users || [])
  }

  const fetchVerifications = async () => {
    const query = new URLSearchParams()
    if (verificationFilter) query.set('status', verificationFilter)
    const { data } = await api.get(`/admin/verifications?${query.toString()}`)
    setVerifications(data.verifications || [])
  }

  const fetchRoleHistory = async () => {
    const { data } = await api.get('/admin/role-assignments')
    setRoleHistory(data.assignments || [])
  }

  const loadAll = async () => {
    try {
      setState({ loading: true, actionId: '', error: '', message: '' })
      await Promise.all([fetchOverview(), fetchUsers(), fetchVerifications(), fetchRoleHistory()])
      setState({ loading: false, actionId: '', error: '', message: '' })
    } catch (error) {
      setState({ loading: false, actionId: '', error: error.response?.data?.message || 'Failed to load admin dashboard.', message: '' })
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchUsers().catch((error) => showError(error, 'Failed to load users.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, filters.status])

  useEffect(() => {
    fetchVerifications().catch((error) => showError(error, 'Failed to load manager verifications.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationFilter])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({ ...previous, [name]: value }))
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    try {
      setState((previous) => ({ ...previous, loading: true, error: '', message: '' }))
      await fetchUsers()
      setState((previous) => ({ ...previous, loading: false }))
    } catch (error) {
      showError(error, 'Failed to search users.')
    }
  }

  const refreshAdminData = async () => {
    await Promise.all([fetchOverview(), fetchUsers(), fetchVerifications(), fetchRoleHistory()])
  }

  const handleSuspendUser = async (userId) => {
    const reason = window.prompt('Reason for suspension?') || ''
    try {
      setState((previous) => ({ ...previous, actionId: userId, error: '', message: '' }))
      await api.patch(`/admin/users/${userId}/suspend`, { reason })
      await refreshAdminData()
      showMessage('User suspended successfully.')
    } catch (error) {
      showError(error, 'Failed to suspend user.')
    }
  }

  const handleRestoreUser = async (userId) => {
    try {
      setState((previous) => ({ ...previous, actionId: userId, error: '', message: '' }))
      await api.patch(`/admin/users/${userId}/restore`)
      await refreshAdminData()
      showMessage('User restored successfully.')
    } catch (error) {
      showError(error, 'Failed to restore user.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Soft-delete this user? Existing linked data will stay safe.')) return
    try {
      setState((previous) => ({ ...previous, actionId: userId, error: '', message: '' }))
      await api.delete(`/admin/users/${userId}`)
      await refreshAdminData()
      showMessage('User soft-deleted successfully.')
    } catch (error) {
      showError(error, 'Failed to delete user.')
    }
  }

  const handleChangeRole = async (userId, currentRole) => {
    const nextRole = window.prompt('Enter new role: tenant, manager, or admin', currentRole)
    if (!nextRole) return
    const reason = window.prompt('Reason for role change?') || ''

    try {
      setState((previous) => ({ ...previous, actionId: userId, error: '', message: '' }))
      await api.patch(`/admin/users/${userId}/role`, { role: nextRole.trim().toLowerCase(), reason })
      await refreshAdminData()
      showMessage('Role updated successfully.')
    } catch (error) {
      showError(error, 'Failed to update role.')
    }
  }

  const handleReviewVerification = async (verificationId, nextStatus) => {
    const adminNote = window.prompt(nextStatus === 'verified' ? 'Approval note for manager?' : 'Reason for rejection?') || ''

    try {
      setState((previous) => ({ ...previous, actionId: verificationId, error: '', message: '' }))
      await api.patch(`/admin/verifications/${verificationId}/review`, { status: nextStatus, adminNote })
      await refreshAdminData()
      showMessage(nextStatus === 'verified' ? 'Manager verified successfully.' : 'Manager verification rejected.')
    } catch (error) {
      showError(error, 'Failed to review manager verification.')
    }
  }

  const handleAdminFormChange = (event) => {
    const { name, value } = event.target
    setAdminForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleCreateAdmin = async (event) => {
    event.preventDefault()
    try {
      setState((previous) => ({ ...previous, actionId: 'create-admin', error: '', message: '' }))
      await api.post('/admin/users/create-admin', adminForm)
      setAdminForm(ADMIN_FORM_INITIAL)
      await refreshAdminData()
      showMessage('Admin account created successfully.')
    } catch (error) {
      showError(error, 'Failed to create admin account.')
    }
  }

  const handleAnnouncementChange = (event) => {
    const { name, value } = event.target
    setAnnouncementForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSendAnnouncement = async (event) => {
    event.preventDefault()
    try {
      setState((previous) => ({ ...previous, actionId: 'send-announcement', error: '', message: '' }))
      const payload = {
        ...announcementForm,
        expiresAt: announcementForm.expiresAt || undefined
      }
      const { data } = await api.post('/admin/announcements', payload)
      setAnnouncementForm(ANNOUNCEMENT_FORM_INITIAL)
      showMessage(`Announcement sent to ${data.notifiedUsers || 0} user(s).`)
    } catch (error) {
      showError(error, 'Failed to send announcement.')
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap admin-command-wrap">
        <section className="card admin-hero-card">
          <p className="badge">Global Admin Command Center</p>
          <h1>KeyCove Platform Control</h1>
          <p>Manage platform overview, users, roles, admin accounts, and manager verification without changing tenant or manager workflows.</p>
          <div className="hero-actions" style={{ marginTop: '18px' }}>
            <Link to="/admin/reports" className="secondary-btn">Property Reports</Link>
          </div>
        </section>

        {state.loading ? <p className="center-box">Loading admin dashboard...</p> : null}
        {state.error ? <p className="error-text">{state.error}</p> : null}
        {state.message ? <p className="success-text">{state.message}</p> : null}

        <div className="admin-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users & Roles</button>
          <button className={activeTab === 'verifications' ? 'active' : ''} onClick={() => setActiveTab('verifications')}>Manager Verification</button>
          <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>Broadcast</button>
          <button className={activeTab === 'createAdmin' ? 'active' : ''} onClick={() => setActiveTab('createAdmin')}>Create Admin</button>
        </div>

        {activeTab === 'overview' ? (
          <section className="admin-stat-grid">
            {overviewItems.map((item) => (
              <article className="card admin-stat-card" key={item.key}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === 'users' ? (
          <section className="card admin-panel-card">
            <div className="manager-list-header">
              <div>
                <h2>User & Role Management</h2>
                <p>Search users, suspend or restore accounts, soft-delete users, and change user roles.</p>
              </div>
            </div>

            <form className="admin-filter-bar" onSubmit={handleSearchSubmit}>
              <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search name, email, company, phone" />
              <select name="role" value={filters.role} onChange={handleFilterChange}>
                <option value="">All Roles</option>
                <option value="tenant">Tenant</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">Active + Suspended</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deleted">Deleted</option>
              </select>
              <button className="primary-btn" type="submit">Search</button>
            </form>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Manager Verification</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => {
                    const userId = getUserId(item)
                    return (
                      <tr key={userId}>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td><span className="admin-role-pill">{item.role}</span></td>
                        <td><span className={getStatusClass(item.accountStatus)}>{item.accountStatus || 'active'}</span></td>
                        <td>{item.role === 'manager' ? (item.managerVerificationStatus || 'not_submitted') : '-'}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          <div className="admin-action-row">
                            <button type="button" className="secondary-btn" onClick={() => handleChangeRole(userId, item.role)} disabled={state.actionId === userId}>Role</button>
                            {item.accountStatus === 'suspended' || item.accountStatus === 'deleted' ? (
                              <button type="button" className="secondary-btn" onClick={() => handleRestoreUser(userId)} disabled={state.actionId === userId}>Restore</button>
                            ) : (
                              <button type="button" className="secondary-btn" onClick={() => handleSuspendUser(userId)} disabled={state.actionId === userId}>Suspend</button>
                            )}
                            <button type="button" className="danger-btn" onClick={() => handleDeleteUser(userId)} disabled={state.actionId === userId}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!users.length ? (
                    <tr>
                      <td colSpan="7">No users found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="admin-subsection">
              <h3>Recent Role Changes</h3>
              <div className="admin-table-wrap">
                <table className="admin-table compact-admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Previous</th>
                      <th>New</th>
                      <th>Changed By</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleHistory.map((item) => (
                      <tr key={item._id}>
                        <td>{item.user?.name || 'Unknown'} ({item.user?.email || 'no email'})</td>
                        <td>{item.previousRole}</td>
                        <td>{item.newRole}</td>
                        <td>{item.assignedBy?.name || 'Admin'}</td>
                        <td>{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                    {!roleHistory.length ? (
                      <tr>
                        <td colSpan="5">No role changes yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'verifications' ? (
          <section className="card admin-panel-card">
            <div className="manager-list-header">
              <div>
                <h2>Manager Verification</h2>
                <p>Review manager business details and approve or reject verification requests.</p>
              </div>
              <select value={verificationFilter} onChange={(event) => setVerificationFilter(event.target.value)}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="verification-card-list">
              {verifications.map((item) => (
                <article className="admin-verification-card" key={item._id}>
                  <div className="manager-list-header">
                    <div>
                      <h3>{item.companyName}</h3>
                      <p>{item.manager?.name || 'Manager'} · {item.manager?.email || 'No email'}</p>
                    </div>
                    <span className={getStatusClass(item.status)}>{item.status}</span>
                  </div>

                  <div className="verification-summary-grid">
                    <div><strong>Business Email:</strong> {item.businessEmail || '-'}</div>
                    <div><strong>Business Phone:</strong> {item.businessPhone || '-'}</div>
                    <div><strong>License:</strong> {item.licenseNumber || '-'}</div>
                    <div><strong>Experience:</strong> {item.yearsOfExperience || 0} year(s)</div>
                    <div><strong>Document Type:</strong> {item.documentType}</div>
                    <div><strong>Submitted:</strong> {formatDate(item.createdAt)}</div>
                    <div className="verification-summary-wide"><strong>Address:</strong> {[item.businessAddress, item.city, item.state, item.country].filter(Boolean).join(', ') || '-'}</div>
                    {item.verificationMessage ? <div className="verification-summary-wide"><strong>Manager Message:</strong> {item.verificationMessage}</div> : null}
                    {item.adminNote ? <div className="verification-summary-wide"><strong>Admin Note:</strong> {item.adminNote}</div> : null}
                    <div className="verification-summary-wide">
                      <strong>Document:</strong> <a href={item.documentUrl} target="_blank" rel="noreferrer">Open submitted document</a>
                    </div>
                  </div>

                  {item.status === 'pending' ? (
                    <div className="admin-action-row">
                      <button type="button" className="primary-btn" onClick={() => handleReviewVerification(item._id, 'verified')} disabled={state.actionId === item._id}>Approve</button>
                      <button type="button" className="danger-btn" onClick={() => handleReviewVerification(item._id, 'rejected')} disabled={state.actionId === item._id}>Reject</button>
                    </div>
                  ) : null}
                </article>
              ))}

              {!verifications.length ? <p>No manager verification requests found.</p> : null}
            </div>
          </section>
        ) : null}

        {activeTab === 'announcements' ? (
          <section className="card admin-panel-card admin-create-card">
            <h2>Broadcast Announcement</h2>
            <p>Send important platform messages to all users or a selected role. Online users receive a toast and everyone gets a bell notification.</p>
            <form className="manager-verification-form announcement-form" onSubmit={handleSendAnnouncement}>
              <div className="form-grid two-col-form-grid">
                <label>
                  Title
                  <input name="title" value={announcementForm.title} onChange={handleAnnouncementChange} required maxLength="160" placeholder="Yearly Maintenance Notice" />
                </label>
                <label>
                  Target Role
                  <select name="targetRole" value={announcementForm.targetRole} onChange={handleAnnouncementChange}>
                    <option value="all">All Users</option>
                    <option value="tenant">Tenants Only</option>
                    <option value="manager">Managers Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </label>
                <label>
                  Priority
                  <select name="priority" value={announcementForm.priority} onChange={handleAnnouncementChange}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
                <label>
                  Expires At
                  <input name="expiresAt" type="datetime-local" value={announcementForm.expiresAt} onChange={handleAnnouncementChange} />
                </label>
                <label className="form-grid-wide">
                  Message
                  <textarea name="message" value={announcementForm.message} onChange={handleAnnouncementChange} required maxLength="1500" rows="5" placeholder="KeyCove will be unavailable for 2 days due to yearly maintenance." />
                </label>
              </div>
              <button type="submit" className="primary-btn" disabled={state.actionId === 'send-announcement'}>
                {state.actionId === 'send-announcement' ? 'Sending...' : 'Send Announcement'}
              </button>
            </form>
          </section>
        ) : null}

        {activeTab === 'createAdmin' ? (
          <section className="card admin-panel-card admin-create-card">
            <h2>Create Admin Account</h2>
            <p>Only an already logged-in admin can create another admin account. Public signup still allows tenant and manager only.</p>
            <form className="manager-verification-form" onSubmit={handleCreateAdmin}>
              <div className="form-grid two-col-form-grid">
                <label>
                  Full Name
                  <input name="name" value={adminForm.name} onChange={handleAdminFormChange} required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" value={adminForm.email} onChange={handleAdminFormChange} required />
                </label>
                <label>
                  Password
                  <input name="password" type="password" value={adminForm.password} onChange={handleAdminFormChange} required minLength="6" />
                </label>
                <label>
                  Phone
                  <input name="phone" value={adminForm.phone} onChange={handleAdminFormChange} />
                </label>
                <label>
                  Department
                  <input name="department" value={adminForm.department} onChange={handleAdminFormChange} />
                </label>
                <label>
                  Access Level
                  <input name="accessLevel" type="number" min="1" value={adminForm.accessLevel} onChange={handleAdminFormChange} />
                </label>
              </div>
              <button type="submit" className="primary-btn" disabled={state.actionId === 'create-admin'}>
                {state.actionId === 'create-admin' ? 'Creating...' : 'Create Admin'}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </>
  )
}
