import { getAuthToken } from './auth'

const BASE_URL = '/api/wishlists'

async function request(path = '', options = {}) {
  const token = getAuthToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  const payload = await response.json()

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.message || 'Wishlist request failed')
    error.fieldErrors = payload?.data?.errors || {}
    error.statusCode = response.status
    throw error
  }

  return payload.data
}

export function getWishlists() {
  return request()
}

export function createWishlistItem(body) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateWishlistItem(id, body) {
  return request(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteWishlistItem(id) {
  return request(`/${id}`, {
    method: 'DELETE',
  })
}
