import * as FiIcons from 'react-icons/fi'
import type { ComponentType } from 'react'

export type IconComponent = ComponentType<{ size?: number; className?: string }>

export interface IconEntry {
  name: string
  component: IconComponent
  category: string
}

/**
 * Categorizes a Feather Icon by its name pattern.
 */
function categorize(name: string): string {
  const n = name.toLowerCase()

  if (['arrow', 'chevron', 'corner', 'move', 'maximize', 'minimize', 'rotate', 'repeat', 'shuffle', 'refresh'].some(k => n.includes(k)))
    return 'Arrows'
  if (['user', 'users'].some(k => n.startsWith(k)))
    return 'Users'
  if (['mail', 'message', 'send', 'phone', 'inbox', 'voicemail', 'rss', 'radio', 'cast', 'bell', 'atSign'].some(k => n.startsWith(k) || n === k))
    return 'Communication'
  if (['dollar', 'credit', 'trending', 'barchart', 'piechart', 'percent', 'shoppingcart', 'shoppingbag', 'tag', 'gift', 'award'].some(k => n.includes(k)))
    return 'Finance'
  if (['shield', 'lock', 'unlock', 'key', 'eye', 'eyeoff', 'alertcircle', 'alerttriangle', 'alertoctagon'].some(k => n.includes(k)))
    return 'Security'
  if (['twitter', 'facebook', 'github', 'linkedin', 'instagram', 'youtube', 'twitch', 'figma', 'codepen', 'codesandbox', 'dribbble', 'chrome', 'gitlab', 'slack', 'trello', 'framer', 'pocket', 'feather', 'aperture'].some(k => n.includes(k)))
    return 'Social'
  if (['image', 'film', 'music', 'video', 'camera', 'mic', 'micoff', 'headphones', 'speaker', 'volume', 'play', 'pause', 'skipforward', 'skipback', 'fastforward', 'rewind', 'tv'].some(k => n.includes(k)))
    return 'Media'
  if (['file', 'folder', 'download', 'upload', 'clipboard', 'paperclip', 'book', 'bookmark', 'archive', 'save', 'printer', 'copy'].some(k => n.includes(k)))
    return 'Files'
  if (['monitor', 'smartphone', 'tablet', 'server', 'database', 'cpu', 'harddrive', 'wifi', 'bluetooth', 'terminal', 'code', 'command', 'hash', 'gitbranch', 'gitcommit', 'gitmerge', 'gitpullrequest'].some(k => n.includes(k)))
    return 'Tech'
  if (['home', 'search', 'menu', 'grid', 'list', 'layout', 'sidebar', 'layers', 'compass', 'map', 'mappin', 'navigation', 'globe', 'anchor', 'crosshair', 'target'].some(k => n.includes(k)))
    return 'Navigation'
  if (['sun', 'moon', 'cloud', 'cloudraining', 'cloudsnow', 'cloudlightning', 'clouddrizzle', 'wind', 'droplet', 'thermometer', 'umbrella', 'sunrise', 'sunset'].some(k => n.includes(k)))
    return 'Weather'
  if (['check', 'x', 'plus', 'minus', 'edit', 'trash', 'share', 'externallink', 'link', 'heart', 'thumbsup', 'thumbsdown', 'star', 'flag', 'zap', 'activity', 'power', 'login', 'logout', 'filter', 'settings', 'sliders', 'tool', 'info', 'helpcircle'].some(k => n.includes(k)))
    return 'Actions'
  if (['clock', 'calendar', 'watch', 'timer', 'stopwatch'].some(k => n.includes(k)))
    return 'Time'
  if (['box', 'package', 'truck', 'loader', 'disc'].some(k => n.includes(k)))
    return 'Objects'

  return 'General'
}

// Auto-generate icon entries from all Feather Icons
const featherIcons: IconEntry[] = Object.entries(FiIcons)
  .filter(([key]) => key.startsWith('Fi') && typeof (FiIcons as any)[key] === 'function')
  .map(([key, component]) => {
    // "FiSearch" -> "Search", "FiArrowUp" -> "ArrowUp"
    const shortName = key.substring(2)
    return {
      name: shortName,
      component: component as IconComponent,
      category: categorize(shortName),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

// All available icons
export const allIcons: IconEntry[] = [...featherIcons]

// Quick lookup map: name -> component (supports both "Search" and "FiSearch" formats)
export const iconMap: Record<string, IconComponent> = {}
for (const entry of allIcons) {
  iconMap[entry.name] = entry.component
  iconMap[`Fi${entry.name}`] = entry.component // Also support "FiSearch" format
}

// Available categories in display order
export const iconCategories: string[] = [
  'Navigation',
  'Actions',
  'Communication',
  'Finance',
  'Security',
  'Social',
  'Media',
  'Files',
  'Tech',
  'Users',
  'Arrows',
  'Time',
  'Weather',
  'Objects',
  'General',
]
