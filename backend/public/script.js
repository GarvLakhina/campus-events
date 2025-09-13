const API_BASE = '';

function getAuth() {
  return {
    student_id: localStorage.getItem('student_id') || '',
    email: localStorage.getItem('email') || '',
  };
}

function setAuth({ student_id, email }) {
  if (student_id) localStorage.setItem('student_id', student_id);
  if (email) localStorage.setItem('email', email);
  document.getElementById('authStatus').innerText = `Auth set: ${student_id || email || 'none'}`;
}

async function loadColleges() {
  const res = await fetch(`${API_BASE}/colleges`);
  const data = await res.json();
  const sel = document.getElementById('collegeFilter');
  sel.innerHTML = '<option value="">All Colleges</option>' + data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadEvents() {
  const collegeId = document.getElementById('collegeFilter').value;
  const url = new URL(`${API_BASE}/events`, window.location.origin);
  if (collegeId) url.searchParams.set('collegeId', collegeId);
  const res = await fetch(url.pathname + url.search);
  const events = await res.json();
  const container = document.getElementById('events');
  container.innerHTML = events.map(e => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">${e.title}</h5>
            <span class="badge text-bg-secondary text-capitalize">${e.type}</span>
          </div>
          <p class="card-text small text-muted mb-2">
            <span class="me-2">#${e.id}</span>
            <span class="me-2">${new Date(e.date).toLocaleString()}</span>
          </p>
          <p class="card-text mb-1"><strong>College:</strong> ${e.college?.name || e.collegeId}</p>
          <p class="card-text mb-3"><strong>Registrations:</strong> ${e._count?.registrations || 0}</p>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-sm btn-success" onclick="document.getElementById('actionEventId').value='${e.id}';">Select</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function registerEvent() {
  const { student_id, email } = getAuth();
  const eventId = document.getElementById('actionEventId').value;
  const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, email })
  });
  const data = await res.json();
  document.getElementById('actionResult').innerText = JSON.stringify(data);
  await loadEvents();
}

async function markAttendance() {
  const { student_id, email } = getAuth();
  const eventId = document.getElementById('actionEventId').value;
  const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, email })
  });
  const data = await res.json();
  document.getElementById('actionResult').innerText = JSON.stringify(data);
}

async function submitFeedback() {
  const { student_id, email } = getAuth();
  const eventId = document.getElementById('actionEventId').value;
  const rating = document.getElementById('rating').value;
  const comment = document.getElementById('comment').value;
  const res = await fetch(`${API_BASE}/events/${eventId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, email, rating: Number(rating), comment })
  });
  const data = await res.json();
  document.getElementById('actionResult').innerText = JSON.stringify(data);
}

// Wire up
window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('saveAuth').addEventListener('click', () => {
    const student_id = document.getElementById('student_id').value;
    const email = document.getElementById('email').value;
    setAuth({ student_id, email });
  });
  document.getElementById('loadEvents').addEventListener('click', loadEvents);
  document.getElementById('btnFeedback').addEventListener('click', submitFeedback);

  const auth = getAuth();
  if (auth.student_id || auth.email) setAuth(auth);
  await loadColleges();
  await loadEvents();
});

