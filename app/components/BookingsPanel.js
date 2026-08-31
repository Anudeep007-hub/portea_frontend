import { useState } from 'react';
import Calendar from './Calendar';
import { times } from './data';

const activeStatuses = ['Waiting for confirmation', 'Confirmed', 'Scheduled'];

export default function BookingsPanel({ bookings, cancelled, onClose, onCancel, onSessionCancel, onReschedule, onScheduleNext }) {
  const list = cancelled
    ? bookings.filter((item) => item.status === 'Cancelled')
    : bookings.filter((item) => item.status !== 'Cancelled');

  return <section className="account-panel">
    <button className="back" onClick={onClose}>Back to booking</button>
    <h2>{cancelled ? 'Cancelled bookings' : 'My bookings'}</h2>
    <p className="subtext">{cancelled ? 'Bookings you cancelled appear here.' : 'Your package and next appointment.'}</p>
    {list.length ? <div className="booking-list">{list.map((item) => <BookingCard key={item.reference} item={item} cancelled={cancelled} onCancel={onCancel} onSessionCancel={onSessionCancel} onReschedule={onReschedule} onScheduleNext={onScheduleNext} />)}</div> : <div className="empty-state">No {cancelled ? 'cancelled' : 'current'} bookings yet.</div>}
  </section>;
}

function BookingCard({ item, cancelled, onCancel, onSessionCancel, onReschedule, onScheduleNext }) {
  const [confirm, setConfirm] = useState(null);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(null);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const sessions = item.sessions || [{ number: 1, date: item.date, time: item.time, status: 'Waiting for confirmation' }];
  const used = sessions.filter((session) => !['Not scheduled', 'Cancelled'].includes(session.status)).length;
  const remaining = Math.max((item.packageSize || sessions.length) - used, 0);
  const activeCount = sessions.filter((session) => activeStatuses.includes(session.status)).length;
  const canScheduleNext = !cancelled && remaining > 0 && activeCount < 2;

  const confirmDelete = () => {
    if (text !== 'DELETE') return;
    if (confirm === 'booking') onCancel(item.reference);
    if (confirm === 'session' && sessionToCancel) onSessionCancel(item.reference, sessionToCancel.number);
    setConfirm(null);
    setText('');
    setSessionToCancel(null);
  };

  return <article className="booking-card">
    <div>
      <span className={`status ${item.status === 'Confirmed' ? 'confirmed' : ''}`}>{item.status === 'New' ? 'Waiting for confirmation' : item.status}</span>
      <h3>{item.service}</h3>
      <p>{item.patient}</p>
      <div className="session-list">
        <b>{remaining} sessions left in package</b>
        {sessions.map((session) => {
          const isScheduled = activeStatuses.includes(session.status);
          const canManage = isScheduled && !['Completed', 'Cancelled'].includes(session.status);
          return <div className={`session-row ${isScheduled ? 'active-session' : ''}`} key={session.number}>
            <span>Session {session.number}: {session.date} at {session.time}</span>
            {!cancelled && canManage && <span className="session-actions"><button type="button" className="action-button reschedule-button" onClick={() => setEditing(session)}>Reschedule</button><button type="button" className="action-button cancel-button" onClick={() => { setSessionToCancel(session); setConfirm('session'); setText(''); }}>Cancel</button></span>}
          </div>;
        })}
      </div>
      {canScheduleNext && <button type="button" className="action-button reschedule-button" onClick={() => onScheduleNext(item)}>Schedule next session</button>}
      {editing && <div className="reschedule"><Calendar selected={editing.isoDate || ''} onSelect={(isoDate) => setEditing({ ...editing, isoDate, date: isoDate })} /><select value={editing.time} onChange={(event) => setEditing({ ...editing, time: event.target.value })}>{times.map((time) => <option key={time}>{time}</option>)}</select><button type="button" className="action-button reschedule-button" onClick={() => { onReschedule(item.reference, editing.number, editing); setEditing(null); }}>Save new time</button></div>}
    </div>
    <div className="booking-meta"><strong>{item.reference}</strong>{!cancelled && <button type="button" className="action-button delete-button" onClick={() => { setConfirm('booking'); setText(''); }}>Delete booking</button>}</div>
    {confirm && <div className="confirm-box"><b>Type DELETE to confirm</b><input value={text} onChange={(event) => setText(event.target.value)} placeholder="DELETE" autoFocus /><button type="button" className="action-button cancel-button" disabled={text !== 'DELETE'} onClick={confirmDelete}>Confirm delete</button><button type="button" className="action-button neutral-button" onClick={() => { setConfirm(null); setText(''); setSessionToCancel(null); }}>Keep it</button></div>}
  </article>;
}
