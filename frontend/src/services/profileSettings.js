import { getAuthToken } from './auth'

const AUTH_BASE_URL = '/api/auth'
const SETTINGS_KEY = 'livo_profile_settings'

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
    return {
      budgetAlerts: true,
      reminderNotifications: true,
      weeklySummary: false,
    }
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {
      budgetAlerts: true,
      reminderNotifications: true,
      weeklySummary: false,
    }
  }
}

export function saveLocalSettings(userId, settings) {
  localStorage.setItem(`${SETTINGS_KEY}:${userId}`, JSON.stringify(settings))
}
