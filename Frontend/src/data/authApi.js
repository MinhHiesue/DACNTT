const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const SESSION_KEY = 'northstar-auth'

export async function submitAuth(mode, formData) {
  const response = await fetch(`${API_URL}/api/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  const result = await response.json()

  if (!response.ok) {
    throw Object.assign(new Error(result.message || 'Không thể xác thực tài khoản.'), { status: response.status })
  }

  return result.data
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const result = await response.json()

  if (!response.ok) {
    throw Object.assign(new Error(result.message || 'Phiên đăng nhập không hợp lệ.'), { status: response.status })
  }

  return result.data.user
}

async function adminRequest(path, token, options = {}) {
  const response = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const result = await response.json()

  if (!response.ok) {
    throw Object.assign(new Error(result.message || 'Không thể thực hiện thao tác quản trị.'), { status: response.status })
  }

  return result.data
}

export function getAdminUsers(token, filters, signal) {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: '20',
    search: filters.search,
    role: filters.role,
    status: filters.status,
  })
  return adminRequest(`/users?${params}`, token, { signal })
}

export function updateAdminUserRole(token, userId, role) {
  return adminRequest(`/users/${encodeURIComponent(userId)}/role`, token, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function updateAdminUserStatus(token, userId, isActive) {
  return adminRequest(`/users/${encodeURIComponent(userId)}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

export function deleteAdminUser(token, userId) {
  return adminRequest(`/users/${encodeURIComponent(userId)}`, token, { method: 'DELETE' })
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function loadSession() {
  const saved = localStorage.getItem(SESSION_KEY)
  if (!saved) return null

  try {
    const session = JSON.parse(saved)
    if (session?.token && session?.user) return session
    clearSession()
    return null
  } catch (error) {
    if (error instanceof SyntaxError) {
      clearSession()
      return null
    }

    throw error
  }
}
