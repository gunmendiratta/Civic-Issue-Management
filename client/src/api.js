import axios from 'axios'

export const API_URL = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '')
export const api = axios.create({ baseURL: API_URL })
export const request = (config) => api({ ...config, headers: { ...config.headers, ...(localStorage.getItem('civicconnect-token') ? { Authorization: `Bearer ${localStorage.getItem('civicconnect-token')}` } : {}) } })
export const imageUrl = (url) => /^https?:\/\//.test(url) ? url : `${API_URL.replace('/api', '')}${url}`
