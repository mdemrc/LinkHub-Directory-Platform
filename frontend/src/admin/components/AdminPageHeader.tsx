import { ReactNode } from 'react'
import { FiPlus } from 'react-icons/fi'
import AdminButton from './AdminButton'

interface AdminPageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  children?: ReactNode
}

export default function AdminPageHeader({ title, description, action, children }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && (
          <p className="text-sm text-lz-muted mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action && (
          <AdminButton onClick={action.onClick} icon={action.icon || <FiPlus size={16} />}>
            {action.label}
          </AdminButton>
        )}
      </div>
    </div>
  )
}
