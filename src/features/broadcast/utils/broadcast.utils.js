const AVATAR_COLORS = ['#3b82f6', '#a43a3a', '#006c49', '#f59e0b', '#8b5cf6', '#0ea5e9']

export function initialsOf(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

export function avatarColorFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function formatNoticeDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
