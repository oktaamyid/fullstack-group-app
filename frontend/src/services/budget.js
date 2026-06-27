import { getAuthToken } from './auth'

const BASE_URL = '/api/budgets'

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
    throw new Error(payload?.message || 'Request failed')
  }

  return payload.data
}

export async function getBudgets(month, year) {
  const query = new URLSearchParams();
  if (month) query.append('month', month);
  if (year) query.append('year', year);
  
  const queryString = query.toString();
  const path = queryString ? `?${queryString}` : '';
  
  const data = await request(path);
  return data.budgets || [];
}

export async function setBudget(data) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteBudget(id) {
  return request(`/${id}`, {
    method: 'DELETE',
  });
}

export async function getBudgetProgress(month, year) {
  const query = new URLSearchParams();
  if (month) query.append('month', month);
  if (year) query.append('year', year);
  
  const queryString = query.toString();
  const path = queryString ? `/progress?${queryString}` : '/progress';
  
  return request(path);
}
