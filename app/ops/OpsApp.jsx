import { useEffect, useState } from 'react';
import { API } from '../components/data';

const OPS_SESSION_KEY = 'portea_ops_session';

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function readError(response) {
  return response.json()
    .then((data) => data.detail || 'Something went wrong. Please try again.')
    .catch(() => 'Something went wrong. Please try again.');
}

export default function OpsApp() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [selectedPhysios, setSelectedPhysios] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(OPS_SESSION_KEY);
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) loadDashboard(token);
  }, [token]);

  async function loadDashboard(activeToken = token) {
    setLoading(true);

    try {
      const response = await fetch(`${API}/ops/dashboard`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (response.status === 401) {
        localStorage.removeItem(OPS_SESSION_KEY);
        setToken('');
        throw new Error('Your OPS session has expired. Please sign in again.');
      }

      if (!response.ok) throw new Error(await readError(response));

      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    setMessage('');

    if (!username.trim() || !password) {
      setMessage('Enter your OPS username and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/ops/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const data = await response.json();
      localStorage.setItem(OPS_SESSION_KEY, data.access_token);
      setToken(data.access_token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function availablePhysios(appointment) {
    if (!dashboard) return [];

    if (appointment.physio_choice === 'PREFERRED_PHYSIO') {
      return dashboard.physios.filter(
        (physio) => physio.person_ref === appointment.preferred_physio_ref,
      );
    }

    return dashboard.physios.filter(
      (physio) => physio.service_pincode === appointment.pincode,
    );
  }

  async function confirmAppointment(appointment) {
    const selectedPhysio = selectedPhysios[appointment.appt_ref]
      || appointment.preferred_physio_ref
      || '';

    if (!selectedPhysio) {
      setMessage('Choose a physiotherapist before confirming this appointment.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API}/ops/appointments/${appointment.appt_ref}/confirm`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ physio_ref: selectedPhysio }),
      });

      if (!response.ok) throw new Error(await readError(response));

      setMessage(`Appointment ${appointment.appt_ref} confirmed.`);
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    localStorage.removeItem(OPS_SESSION_KEY);
    setToken('');
    setDashboard(null);
    setMessage('Signed out successfully.');
  }

  if (!token) {
    return <main className="ops-page">
      <section className="ops-login-card">
        <p className="eyebrow">PORTEA INTERNAL</p>
        <h1>OPS booking desk</h1>
        <p>Confirm patient appointments and assign physiotherapists.</p>

        <form onSubmit={signIn} className="ops-login-form">
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {message && <p className="ops-message error">{message}</p>}
          <button className="primary" disabled={loading}>Sign in to OPS</button>
        </form>
      </section>
    </main>;
  }

  const pending = dashboard?.pending_appointments || [];
  const appointments = dashboard?.appointments || [];
  const unscheduledBookings = dashboard?.unscheduled_bookings || [];
  const activity = dashboard?.activity || [];

  return <main className="ops-page">
    <header className="ops-header">
      <div>
        <p className="eyebrow">PORTEA INTERNAL</p>
        <h1>OPS booking desk</h1>
      </div>
      <div className="ops-header-actions">
        <button className="secondary" onClick={() => loadDashboard()} disabled={loading}>Refresh</button>
        <button className="ops-signout" onClick={signOut}>Sign out</button>
      </div>
    </header>

    <section className="ops-content">
      {message && <p className="ops-message">{message}</p>}

      <div className="ops-summary">
        <div><strong>{pending.length}</strong><span>Appointments waiting</span></div>
        <div><strong>{unscheduledBookings.length}</strong><span>Bookings needing a slot</span></div>
      </div>

      <section>
        <div className="ops-section-heading">
          <div>
            <h2>Appointments</h2>
            <p>Confirm pending appointments. Confirmed appointments stay visible for reference.</p>
          </div>
        </div>

        {appointments.length === 0 ? <div className="empty-state">No appointments have been created yet.</div> : (
          <div className="ops-appointment-list">
            {appointments.map((appointment) => {
              const physios = availablePhysios(appointment);
              const isPreferred = appointment.physio_choice === 'PREFERRED_PHYSIO';
              const isPending = appointment.status === 'Pending';

              return <article className="ops-appointment-card" key={appointment.appt_ref}>
                <div className="ops-appointment-main">
                  <span className={`status ${isPending ? '' : 'confirmed'}`}>{isPending ? 'Waiting for OPS' : 'Confirmed'}</span>
                  <h3>{appointment.patient_name}</h3>
                  <p>{appointment.patient_phone} · {appointment.service_name}</p>
                  <p><b>{formatDateTime(appointment.start_at)}</b> · Session {appointment.session_number}</p>
                  <p>{appointment.address_line}, {appointment.pincode}</p>
                  {appointment.condition_notes && <p className="ops-note">Patient note: {appointment.condition_notes}</p>}
                  <small>Booking: {appointment.booking_ref} · Appointment: {appointment.appt_ref}</small>
                </div>

                {isPending ? <div className="ops-confirm-box">
                  <label>Physiotherapist</label>
                  {isPreferred ? <p className="preferred-physio">Patient selected {appointment.preferred_physio_name}. This cannot be changed.</p> : (
                    <select
                      value={selectedPhysios[appointment.appt_ref] || ''}
                      onChange={(event) => setSelectedPhysios({
                        ...selectedPhysios,
                        [appointment.appt_ref]: event.target.value,
                      })}
                    >
                      <option value="">Choose available physio</option>
                      {physios.map((physio) => <option key={physio.person_ref} value={physio.person_ref}>{physio.name} — {physio.specialization}</option>)}
                    </select>
                  )}
                  {!isPreferred && physios.length === 0 && <p className="ops-warning">No active physio serves this pincode yet.</p>}
                  <button className="primary" disabled={loading || (!isPreferred && !selectedPhysios[appointment.appt_ref])} onClick={() => confirmAppointment(appointment)}>Confirm appointment</button>
                </div> : <div className="ops-confirm-box"><b>This appointment is already confirmed.</b><p className="preferred-physio">No further OPS action is needed.</p></div>}
              </article>;
            })}
          </div>
        )}
      </section>

      <section className="ops-activity-section">
        <h2>Bookings needing a slot</h2>
        <p>These older bookings do not have an appointment time. Call the patient and create a new appointment.</p>

        {unscheduledBookings.length === 0 ? <div className="empty-state">Every booking has an appointment slot.</div> : <div className="ops-activity-list">
          {unscheduledBookings.map((item) => <article key={item.booking_ref} className="ops-activity-item">
            <div><b>{item.patient_name} · {item.service_name}</b><span>{item.patient_phone} · {item.address_line}, {item.pincode}</span></div>
            <div><span>{item.booking_ref}</span><small>Booked {formatDateTime(item.created_at)}</small></div>
          </article>)}
        </div>}
      </section>

      <section className="ops-activity-section">
        <h2>Recent activity</h2>
        <p>Shows appointment requests, reschedules, cancellations and OPS confirmations.</p>

        {activity.length === 0 ? <div className="empty-state">No activity recorded yet.</div> : <div className="ops-activity-list">
          {activity.map((item) => <article key={item.id} className="ops-activity-item">
            <div><b>{item.action}</b><span>{item.patient_name} · {item.booking_ref}</span></div>
            <div><span>{item.actor_type}{item.actor_ref ? `: ${item.actor_ref}` : ''}</span><small>{formatDateTime(item.created_at)}</small></div>
          </article>)}
        </div>}
      </section>
    </section>
  </main>;
}
