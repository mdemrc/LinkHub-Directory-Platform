import { iconMap } from '../lib/iconRegistry'

interface DynamicIconProps {
  name: string
  size?: number
  className?: string
}

/**
 * Renders an icon by name.
 * - Feather icon names ("Search", "FiSearch") use the icon registry.
 * - Font Awesome classes ("fa-solid fa-circle-user") render via <i> tag.
 * - Falls back to a circle icon if no match.
 */
export default function DynamicIcon({ name, size = 16, className = '' }: DynamicIconProps) {
  if (!name) return null

  if (name.startsWith('fa-') || name.startsWith('fa ') || name.startsWith('fas ') || name.startsWith('far ') || name.startsWith('fab ')) {
    return <i className={`${name} ${className}`} style={{ fontSize: size }} />
  }

  const IconComponent = iconMap[name] || iconMap['Circle']
  if (!IconComponent) return null
  return <IconComponent size={size} className={className} />
}

export { iconMap }
