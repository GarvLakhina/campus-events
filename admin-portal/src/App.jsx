import React, { useEffect, useState } from 'react'

const API_BASE = '' // proxied via Vite to http://localhost:4000

export default function App() {
  const [colleges, setColleges] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'workshop', date: '', collegeId: '' })
  const [filter, setFilter] = useState({ type: '', collegeId: '' })
  const [message, setMessage] = useState('')
  const [attendance, setAttendance] = useState({ eventId: '', student_id: '', email: '' })
  const [attendanceMsg, setAttendanceMsg] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [registrationsByEvent, setRegistrationsByEvent] = useState({}) // { [eventId]: { loading, items: [] } }

  async function loadColleges() {
    const res = await fetch(`${API_BASE}/colleges`)
    const data = await res.json()
    setColleges(data)
  }

  async function fetchRegistrations(eventId) {
    setRegistrationsByEvent(prev => ({ ...prev, [eventId]: { loading: true, items: prev[eventId]?.items || [] } }))
    try {
      const res = await fetch(`/events/${eventId}/registrations`)
      const items = await res.json()
      setRegistrationsByEvent(prev => ({ ...prev, [eventId]: { loading: false, items } }))
    } catch (e) {
      setRegistrationsByEvent(prev => ({ ...prev, [eventId]: { loading: false, items: [] } }))
    }
  }

  function toggleExpand(eventId) {
    setExpanded(prev => {
      const next = new Set([...prev])
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
        if (!registrationsByEvent[eventId]) fetchRegistrations(eventId)
      }
      return next
    })
  }

  async function setPresent(eventId, student) {
    try {
      await fetch(`/events/${eventId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.student_id || undefined, email: student.email || undefined }),
      })
      await fetchRegistrations(eventId)
    } catch {}
  }

  async function setAbsent(eventId, student) {
    try {
      await fetch(`/events/${eventId}/attendance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.student_id || undefined, email: student.email || undefined }),
      })
      await fetchRegistrations(eventId)
    } catch {}
  }

  async function markAttendanceAdmin(e) {
    e.preventDefault()
    setAttendanceMsg('')
    const { eventId, student_id, email } = attendance
    if (!eventId || (!student_id && !email)) {
      setAttendanceMsg('Provide Event ID and either Student ID or Email')
      return
    }
    try {
      const res = await fetch(`/events/${Number(eventId)}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student_id || undefined, email: email || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAttendanceMsg(data.error || 'Failed to mark attendance')
        return
      }
      setAttendanceMsg('Attendance marked successfully')
    } catch (err) {
      setAttendanceMsg('Failed to mark attendance')
    }
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
    <div>
      <header className="bg-white border-bottom py-3 shadow-sm">
        <div className="container d-flex align-items-center justify-content-between">
          <h1 className="h4 mb-0">Campus Events Admin</h1>
          <span className="text-muted small">Manage events and colleges</span>
        </div>
      </header>

      <main className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h2 className="h5 mb-0">Create Event</h2>
              </div>
              <div className="card-body">
                <form onSubmit={createEvent} className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Title</label>
                    <input className="form-control" placeholder="AI Workshop" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <input className="form-control" placeholder="Short description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="workshop">workshop</option>
                      <option value="fest">fest</option>
                      <option value="seminar">seminar</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Date/Time</label>
                    <input className="form-control" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">College</label>
                    <select className="form-select" value={form.collegeId} onChange={e => setForm({ ...form, collegeId: e.target.value })}>
                      <option value="">Select college</option>
                      {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {message && (
                    <div className="col-12">
                      <div className="alert alert-info py-2 mb-0">{message}</div>
                    </div>
                  )}
                  <div className="col-12 d-grid">
                    <button type="submit" className="btn btn-primary">Create Event</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white">
                <h2 className="h6 mb-0">Mark Attendance</h2>
              </div>
              <div className="card-body">
                <form className="row g-3" onSubmit={markAttendanceAdmin}>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Event ID</label>
                    <input className="form-control" type="number" value={attendance.eventId} onChange={e => setAttendance(a => ({ ...a, eventId: e.target.value }))} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Student ID</label>
                    <input className="form-control" placeholder="S1001" value={attendance.student_id} onChange={e => setAttendance(a => ({ ...a, student_id: e.target.value }))} />
                  </div>
                  <div className="col-12 col-md-5">
                    <label className="form-label">Email</label>
                    <input className="form-control" placeholder="alice@example.com" value={attendance.email} onChange={e => setAttendance(a => ({ ...a, email: e.target.value }))} />
                  </div>
                  <div className="col-12 d-grid d-md-flex gap-2">
                    <button type="submit" className="btn btn-warning">Mark Attendance</button>
                  </div>
                  {attendanceMsg && (
                    <div className="col-12">
                      <div className={`alert ${attendanceMsg.includes('success') ? 'alert-success' : 'alert-danger'} py-2 mb-0`}>{attendanceMsg}</div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Filter Type</label>
                    <select className="form-select" value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
                      <option value="">All</option>
                      <option value="workshop">workshop</option>
                      <option value="fest">fest</option>
                      <option value="seminar">seminar</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-5">
                    <label className="form-label">College</label>
                    <select className="form-select" value={filter.collegeId} onChange={e => setFilter({ ...filter, collegeId: e.target.value })}>
                      <option value="">All</option>
                      {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-md-3 d-grid">
                    <button className="btn btn-outline-primary" onClick={loadEvents}>Apply</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h2 className="h5 mb-0">Events</h2>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="p-4 text-center text-muted">Loading...</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Date</th>
                          <th>College</th>
                          <th>Registrations</th>
                          <th style={{width:120}}>Manage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map(e => (
                          <>
                            <tr key={e.id}>
                              <td className="text-muted">{e.id}</td>
                              <td>{e.title}</td>
                              <td><span className="badge text-bg-secondary text-capitalize">{e.type}</span></td>
                              <td>{new Date(e.date).toLocaleString()}</td>
                              <td>{e.college?.name || e.collegeId}</td>
                              <td>{e._count?.registrations || 0}</td>
                              <td>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleExpand(e.id)}>
                                  {expanded.has(e.id) ? 'Hide' : 'Manage'}
                                </button>
                              </td>
                            </tr>
                            {expanded.has(e.id) && (
                              <tr>
                                <td colSpan="7" className="bg-light">
                                  <div className="p-3">
                                    <h6 className="mb-3">Registrations</h6>
                                    {registrationsByEvent[e.id]?.loading ? (
                                      <div className="text-muted">Loading registrations...</div>
                                    ) : (
                                      <div className="table-responsive">
                                        <table className="table table-sm align-middle">
                                          <thead>
                                            <tr>
                                              <th>Student</th>
                                              <th>Email</th>
                                              <th>Student ID</th>
                                              <th>Status</th>
                                              <th>Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(registrationsByEvent[e.id]?.items || []).map(r => (
                                              <tr key={r.studentId}>
                                                <td>{r.student?.name || '-'}</td>
                                                <td>{r.student?.email || '-'}</td>
                                                <td>{r.student?.student_id || '-'}</td>
                                                <td>
                                                  {r.attended ? (
                                                    <span className="badge text-bg-success">Present</span>
                                                  ) : (
                                                    <span className="badge text-bg-secondary">Absent</span>
                                                  )}
                                                </td>
                                                <td className="d-flex gap-2">
                                                  <button className="btn btn-sm btn-success" onClick={() => setPresent(e.id, r.student)}>Present</button>
                                                  <button className="btn btn-sm btn-outline-danger" onClick={() => setAbsent(e.id, r.student)}>Absent</button>
                                                </td>
                                              </tr>
                                            ))}
                                            {(!registrationsByEvent[e.id] || registrationsByEvent[e.id]?.items?.length === 0) && (
                                              <tr><td colSpan="5" className="text-muted">No registrations yet.</td></tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

