import { useState, useEffect } from 'react'
import { User } from '../types'
import { authApi } from '../lib/api'
import { FiUser, FiMail, FiShield, FiSearch, FiUsers } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminTable, { ActionButtons } from './components/AdminTable'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect } from './components/AdminInput'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'MODERATOR' | 'ADMIN',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await authApi.getAllUsers()
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingUser) {
        const updateData: any = { ...formData }
        if (!updateData.password) delete updateData.password
        await authApi.updateUser(editingUser.id, updateData)
      } else {
        await authApi.createUser(formData)
      }
      fetchUsers()
      closeModal()
    } catch (error) {
      console.error('Failed to save user:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await authApi.deleteUser(id)
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'USER',
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const RoleBadge = ({ role }: { role: string }) => {
    const isAdmin = role === 'ADMIN'
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-full ${
          isAdmin
            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}
      >
        <FiShield size={10} />
        {role}
      </span>
    )
  }

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-lz-accent/20 to-cyan-500/10 rounded-full flex items-center justify-center">
            <FiUser className="text-lz-accent" size={16} />
          </div>
          <span className="font-medium text-white">{user.username}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (user: User) => (
        <div className="flex items-center gap-2 text-gray-400">
          <FiMail size={14} />
          <span className="text-sm">{user.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (user: User) => <RoleBadge role={user.role} />,
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (user: User) => (
        <span className="text-sm text-lz-muted">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      align: 'right' as const,
      render: (user: User) => (
        <ActionButtons onEdit={() => openModal(user)} onDelete={() => handleDelete(user.id)} />
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description={`Manage user accounts (${users.length} total)`}
        action={{ label: 'Add User', onClick: () => openModal() }}
      />

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch
          className="absolute left-4 top-1/2 -translate-y-1/2 text-lz-muted"
          size={16}
        />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-white placeholder:text-lz-muted text-sm focus:outline-none focus:border-lz-accent/50 transition-colors"
        />
      </div>

      <AdminTable
        columns={columns}
        data={filteredUsers}
        keyField="id"
        emptyMessage="No users found"
      />

      {/* Empty search state */}
      {filteredUsers.length === 0 && users.length > 0 && (
        <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-xl mt-4">
          <FiUsers className="mx-auto text-lz-muted/30 mb-3" size={40} />
          <p className="text-lz-muted">No users match your search</p>
        </div>
      )}

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AdminInput
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Enter username"
            required
            help={{
              content: 'Unique identifier for the user. Used for login and displayed in the admin panel.',
            }}
          />

          <AdminInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            required
            help={{
              content: 'Used for password recovery and important notifications. Must be unique.',
            }}
          />

          <AdminInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
            required={!editingUser}
            hint={editingUser ? 'Leave empty to keep current password' : undefined}
            help={{
              content: 'Minimum 8 characters recommended. When editing, leave blank to keep the current password.',
            }}
          />

          <AdminSelect
            label="Role"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as 'USER' | 'MODERATOR' | 'ADMIN' })
            }
            options={[
              { value: 'USER', label: 'User' },
              { value: 'MODERATOR', label: 'Moderator' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            help={{
              content: 'User: Basic access. Moderator: Can manage content. Admin: Full system access including user management.',
            }}
          />

          <div className="flex gap-3 pt-4 border-t border-lz-border/30">
            <AdminButton
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={isSaving} className="flex-1">
              {editingUser ? 'Save Changes' : 'Create User'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
