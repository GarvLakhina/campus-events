import React, { useEffect, useState } from 'react'

const API_BASE = '' // proxied via Vite to http://localhost:4000

export default function App() {
  const [colleges, setColleges] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'workshop', date: '', collegeId: '' })
  const [filter, setFilter] = useState({ type: '', collegeId: '' })
  const [message, setMessage] = useState('')

  async function loadColleges() {
    const res = await fetch(`${API_BASE}/colleges`)
    const data = await res.json()
    setColleges(data)
  }

  async function loadEvents() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.type) params.set('type', filter.type)
    if (filter.collegeId) params.set('collegeId', filter.collegeId)
    const res = await fetch(`/events?${params.toString()}`)
    const data = await res.json()
    setEvents(data)
    setLoading(false)
  }

  async function createEvent(e) {
    e.preventDefault()
    setMessage('')
    if (!form.title || !form.date || !form.collegeId) {
      setMessage('Please fill in title, date, and college')
      return
    }
    const payload = { ...form, collegeId: Number(form.collegeId) }
    const res = await fetch(`/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setMessage(err.error || 'Failed to create event')
      return
    }
    setForm({ title: '', description: '', type: 'workshop', date: '', collegeId: '' })
    setMessage('Event created')
    await loadEvents()
  }

  useEffect(() => {
    loadColleges()
    loadEvents()
  }, [])

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h1>Admin Portal</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Create Event</h2>
        <form onSubmit={createEvent}>
          <div>
            <label>Title: <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          </div>
          <div>
            <label>Description: <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          </div>
          <div>
            <label>Type: 
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="workshop">workshop</option>
                <option value="fest">fest</option>
                <option value="seminar">seminar</option>
              </select>
            </label>
          </div>
          <div>
            <label>Date/Time: <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
          </div>
          <div>
            <label>College: 
              <select value={form.collegeId} onChange={e => setForm({ ...form, collegeId: e.target.value })}>
                <option value="">Select college</option>
                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <button type="submit">Create</button>
        </form>
        {message && <p>{message}</p>}
      </section>

      <section>
        <h2>Events</h2>
        <div style={{ marginBottom: 8 }}>
          <label>Filter Type: 
            <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
              <option value="">All</option>
              <option value="workshop">workshop</option>
              <option value="fest">fest</option>
              <option value="seminar">seminar</option>
            </select>
          </label>
          <label style={{ marginLeft: 16 }}>College: 
            <select value={filter.collegeId} onChange={e => setFilter({ ...filter, collegeId: e.target.value })}>
              <option value="">All</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button style={{ marginLeft: 16 }} onClick={loadEvents}>Apply</button>
        </div>
        {loading ? <p>Loading...</p> : (
          <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Date</th>
                <th>College</th>
                <th>Registrations</th>
              </tr>
            </thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.title}</td>
                  <td>{e.type}</td>
                  <td>{new Date(e.date).toLocaleString()}</td>
                  <td>{e.college?.name || e.collegeId}</td>
                  <td>{e._count?.registrations || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
