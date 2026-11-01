const API_ROOT = '/api'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('service-store-token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_ROOT}${path}`, { ...options, headers })
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверьте, запущен ли API.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Ошибка запроса (${response.status})`)
  return data
}
