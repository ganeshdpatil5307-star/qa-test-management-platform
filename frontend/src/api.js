import axios from 'axios'

const TOKEN_KEY = 'qa_access_token'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeSession(auth) {
  localStorage.setItem(TOKEN_KEY, auth.token)
  localStorage.setItem('qa_user', JSON.stringify({ username: auth.username, role: auth.role }))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('qa_user')
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession()
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  },
)
