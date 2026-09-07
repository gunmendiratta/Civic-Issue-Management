import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import LocationPicker from './LocationPicker.jsx'
import './report-location.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const api = axios.create({ baseURL: API_URL })
const categories = ['Pothole', 'Garbage / Waste', 'Broken Streetlight', 'Water Leakage', 'Road Damage', 'Drainage Issue', 'Fallen Tree', 'Traffic Signal Damage', 'Illegal Dumping', 'Public Infrastructure Damage', 'Other']
const request = (config) => api({ ...config, headers: { ...config.headers, ...(localStorage.getItem('civicconnect-token') ? { Authorization: `Bearer ${localStorage.getItem('civicconnect-token')}` } : {}) } })

export default function ReportPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', category: '', description: '', address: '', latitude: '', longitude: '', ward: '', landmark: '' })
  const [files, setFiles] = useState([])
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (!confirmed) return setError('Confirm the location of the issue before submitting.')
    setBusy(true)
    setError('')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => value !== '' && data.append(key, value))
      files.forEach((file) => data.append('images', file))
      const response = await request({ url: '/issues', method: 'post', data })
      navigate(`/issues/${response.data._id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not submit the report.')
    } finally {
      setBusy(false)
    }
  }
  return <main className="form-page"><Link className="back" to="/dashboard">← Back to dashboard</Link><div className="page-intro"><div className="eyebrow">New civic report</div><h1>Let’s get it fixed.</h1><p>Clear evidence and an accurate issue location help the right team respond faster.</p></div><form className="report-card" onSubmit={submit}><div className="form-grid"><label className="full">Issue title<input required minLength="5" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Category<select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">Choose a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Ward (optional)<input value={form.ward} onChange={(event) => setForm({ ...form, ward: event.target.value })} /></label><LocationPicker form={form} setForm={setForm} confirmed={confirmed} setConfirmed={setConfirmed} setError={setError} /><label className="full">Description<textarea required minLength="10" rows="5" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="full upload">Add evidence<span>Up to five JPG, PNG or WEBP images; 5 MB each</span><input multiple type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFiles([...event.target.files].slice(0, 5))} /></label></div>{error && <p className="error">{error}</p>}<div className="form-bottom"><p>AI recommendations inform authorities; they never replace human review.</p><button className="primary" disabled={busy || !confirmed}>{busy ? 'Submitting…' : 'Submit report →'}</button></div></form></main>
}
