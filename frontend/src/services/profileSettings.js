import { getAuthToken } from './auth'

const AUTH_BASE_URL = '/api/auth'
const SETTINGS_KEY = 'livo_profile_settings'

const DEFAULT_TRANSACTION_CATEGORIES = {
  EXPENSE: ['FOOD', 'TRANSPORT', 'EDUCATION', 'ENTERTAINMENT', 'UTILITIES', 'OTHER'],
  INCOME: ['SALARY', 'ALLOWANCE', 'FREELANCE', 'INVESTMENT', 'GIFT', 'OTHER'],
}

const DEFAULT_CATEGORY_ICONS = {
  FOOD: '🍕',
  TRANSPORT: '🚗',
  EDUCATION: '📚',
  ENTERTAINMENT: '🎬',
  UTILITIES: '💡',
  OTHER: '📌',
  SALARY: '💼',
  ALLOWANCE: '💳',
  FREELANCE: '💻',
  INVESTMENT: '📈',
  GIFT: '🎁',
}

const DEFAULT_SETTINGS = {
  budgetAlerts: true,
  reminderNotifications: true,
  weeklySummary: false,
  currency: 'IDR',
  language: 'id-ID',
  categories: DEFAULT_TRANSACTION_CATEGORIES,
  categoryIcons: DEFAULT_CATEGORY_ICONS,
}

function sanitizeCategoryKey(label = '') {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function normalizeCategoryList(list = [], fallback = []) {
  const merged = [...fallback, ...list]
  return [...new Set(merged.filter(Boolean).map((item) => String(item).trim().toUpperCase()))]
}

function normalizeIcon(icon = '') {
  const value = String(icon || '').trim()
  if (!value) {
    return ''
  }

  return value.slice(0, 4)
}

function normalizeCategoryIcons(input = {}) {
  const result = { ...DEFAULT_CATEGORY_ICONS }

  Object.entries(input || {}).forEach(([categoryKey, icon]) => {
    const key = sanitizeCategoryKey(categoryKey)
    const normalized = normalizeIcon(icon)

    if (key && normalized) {
      result[key] = normalized
    }
  })

  return result
}

function normalizeSettings(input = {}) {
  const categories = input?.categories || {}
  const categoryIcons = input?.categoryIcons || {}

  return {
    ...DEFAULT_SETTINGS,
    ...input,
    currency: typeof input?.currency === 'string' && input.currency.trim() ? input.currency.trim().toUpperCase() : DEFAULT_SETTINGS.currency,
    language: typeof input?.language === 'string' && input.language.trim() ? input.language.trim() : DEFAULT_SETTINGS.language,
    categories: {
      EXPENSE: normalizeCategoryList(categories.EXPENSE, DEFAULT_TRANSACTION_CATEGORIES.EXPENSE),
      INCOME: normalizeCategoryList(categories.INCOME, DEFAULT_TRANSACTION_CATEGORIES.INCOME),
    },
    categoryIcons: normalizeCategoryIcons(categoryIcons),
  }
}

async function authRequest(path, options = {}) {
  const token = getAuthToken()

  const response = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  const payload = await response.json()

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.data?.detail || payload?.message || 'Profile request failed')
  }

  return payload.data
}

export function fetchProfile() {
  return authRequest('/profile')
}

export function updateProfile(body) {
  return authRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function updatePassword(body) {
  return authRequest('/profile/password', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function getLocalSettings(userId) {
  const raw = localStorage.getItem(`${SETTINGS_KEY}:${userId}`)

  if (!raw) {
    return normalizeSettings()
  }

  try {
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return normalizeSettings()
  }
}

export function saveLocalSettings(userId, settings) {
  const normalized = normalizeSettings(settings)
  localStorage.setItem(`${SETTINGS_KEY}:${userId}`, JSON.stringify(normalized))

  window.dispatchEvent(
    new CustomEvent('livo:settings-updated', {
      detail: {
        userId,
        settings: normalized,
      },
    })
  )
}

export function isDefaultCategory(type, categoryKey) {
  return DEFAULT_TRANSACTION_CATEGORIES[type]?.includes(categoryKey) || false
}

export function addCategorySetting(userId, type, label, icon = '') {
  const normalizedType = type === 'INCOME' ? 'INCOME' : 'EXPENSE'
  const key = sanitizeCategoryKey(label)
  const normalizedIcon = normalizeIcon(icon)

  if (!key) {
    throw new Error('Category name cannot be empty.')
  }

  const current = getLocalSettings(userId)
  const existing = current.categories[normalizedType] || []

  if (existing.includes(key)) {
    throw new Error('Category already exists.')
  }

  const next = {
    ...current,
    categories: {
      ...current.categories,
      [normalizedType]: [...existing, key],
    },
    categoryIcons: {
      ...current.categoryIcons,
      [key]: normalizedIcon || (normalizedType === 'INCOME' ? '💰' : '🏷️'),
    },
  }

  saveLocalSettings(userId, next)
  return next
}

export function removeCategorySetting(userId, type, categoryKey) {
  const normalizedType = type === 'INCOME' ? 'INCOME' : 'EXPENSE'
  const key = String(categoryKey || '').trim().toUpperCase()

  if (!key) {
    return getLocalSettings(userId)
  }

  if (isDefaultCategory(normalizedType, key)) {
    throw new Error('Default categories cannot be removed.')
  }

  const current = getLocalSettings(userId)
  const nextList = (current.categories[normalizedType] || []).filter((item) => item !== key)

  const next = {
    ...current,
    categories: {
      ...current.categories,
      [normalizedType]: nextList,
    },
    categoryIcons: {
      ...current.categoryIcons,
    },
  }

  delete next.categoryIcons[key]

  saveLocalSettings(userId, next)
  return next
}

export function getCategoryIcon(settings, categoryKey) {
  const key = sanitizeCategoryKey(categoryKey)
  if (!key) {
    return '🏷️'
  }

  const icon = settings?.categoryIcons?.[key]
  return normalizeIcon(icon) || DEFAULT_CATEGORY_ICONS[key] || '🏷️'
}

export { DEFAULT_SETTINGS, DEFAULT_TRANSACTION_CATEGORIES, DEFAULT_CATEGORY_ICONS }
