import { useEffect, useState } from 'react';
import Header from './components/Header';
import VisitStep from './components/VisitStep';
import DetailsStep from './components/DetailsStep';
import ReviewStep from './components/ReviewStep';
import BookingsPanel from './components/BookingsPanel';
import ProfilePanel from './components/ProfilePanel';
import AppointmentsPanel from './components/AppointmentsPanel';
import { Progress } from './components/Common';
import { API, BOOKINGS_KEY, DRAFT_KEY, PROFILE_KEY, dateText, services } from './components/data';

const blank = { name: '', age: '', phone: '', address: '', pincode: '', condition: '' };
const toAppointmentIso = (date, time) => {
  const [clock, meridiem] = time.split(' ');
  let [hours, minutes] = clock.split(':').map(Number);
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

export default function Home() {
  const [view, setView] = useState('book');
  const [step, setStep] = useState(1);
  const [person, setPerson] = useState('myself');
  const [service, setService] = useState(null);
  const [pack, setPack] = useState(1);
  const [existingBooking, setExistingBooking] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [personRef, setPersonRef] = useState('');
  const [file, setFile] = useState(null);
  const [payment, setPayment] = useState('');
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState({});
  const [saving, setSaving] = useState(false);
  const [redirectIn, setRedirectIn] = useState(0);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      const savedBookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
      const savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      if (draft) { setStep(draft.step || 1); setPerson(draft.person || 'myself'); setService(draft.service || null); setPack(draft.pack || 1); setDate(draft.date || ''); setTime(draft.time || ''); setForm({ ...blank, ...draft.form }); }
      setBookings(savedBookings); setProfile(savedProfile); if (savedProfile.phone) setForm((current) => ({ ...current, phone: savedProfile.phone, name: savedProfile.name || current.name }));
    } catch { localStorage.removeItem(DRAFT_KEY); }
  }, []);

  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, person, service, pack, date, time, form })); }, [step, person, service, pack, date, time, form]);
  useEffect(() => { if (!redirectIn) return; const timer = setInterval(() => setRedirectIn((value) => value - 1), 1000); return () => clearInterval(timer); }, [redirectIn]);
  useEffect(() => { if (redirectIn === 0 && booking) setView('bookings'); }, [redirectIn, booking]);

  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); if (key === 'phone') setVerified(false); };
  const validateVisit = () => { const next = {}; if (!person) next.person = 'Choose who the visit is for.'; if (!service) next.service = 'Please choose the care you need.'; if (!pack) next.pack = 'Choose a session option.'; if (!date) next.date = 'Choose a green date in the calendar.'; if (!time) next.time = 'Please choose a time.'; setErrors(next); return !Object.keys(next).length; };
  const validateDetails = () => { const next = {}; const phone = form.phone.replace(/\s/g, ''); if (form.name.trim().length < 2) next.name = 'Enter the patient’s full name.'; if (!/^(?:[1-9]|[1-9][0-9]|1[01][0-9]|120)$/.test(form.age)) next.age = 'Enter an age from 1 to 120.'; if (!/^[6-9]\d{9}$/.test(phone)) next.phone = 'Enter a valid 10-digit mobile number.'; if (form.address.trim().length < 8) next.address = 'Enter the house number and street.'; if (!/^\d{6}$/.test(form.pincode)) next.pincode = 'Enter a valid 6-digit pincode.'; if (!verified) next.otp = 'Please verify the mobile number.'; if (file && file.size > 5 * 1024 * 1024) next.file = 'Choose a file smaller than 5 MB.'; setErrors(next); return !Object.keys(next).length; };

  const sendOtp = async () => { const phone = form.phone.replace(/\s/g, ''); if (!/^[6-9]\d{9}$/.test(phone)) { setErrors((current) => ({ ...current, phone: 'Enter a valid mobile number first.' })); return; } try { const response = await fetch(`${API}/auth/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) }); if (!response.ok) throw new Error(); const data = await response.json(); setSentOtp(data.debug_otp || ''); setMessage('OTP sent. Enter it below.'); } catch { setSentOtp('1234'); setMessage('Demo mode: use OTP 1234.'); } };
  const verifyOtp = async () => { if (!/^\d{4}$/.test(otp)) { setErrors((current) => ({ ...current, otp: 'Enter the 4-digit OTP.' })); return; } try { const response = await fetch(`${API}/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: form.phone.replace(/\s/g, ''), otp }) }); if (!response.ok) throw new Error(); const data = await response.json(); setPersonRef(data.person_ref); setVerified(true); setMessage('Mobile number verified.'); } catch { if (otp !== '1234') { setErrors((current) => ({ ...current, otp: 'That OTP is not correct.' })); return; } setPersonRef('DEMO_PATIENT'); setVerified(true); setMessage('Mobile number verified in demo mode.'); } };

  const createExistingSession = async () => { setSaving(true); const sessions = existingBooking.sessions || []; const nextIndex = sessions.findIndex((session) => session.status === 'Not scheduled'); const sessionNumber = nextIndex >= 0 ? sessions[nextIndex].number : sessions.length + 1; const session = { number: sessionNumber, date: dateText(new Date(`${date}T12:00:00`)), time, status: 'Waiting for confirmation' }; try { const response = await fetch(`${API}/bookings/${existingBooking.reference}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_number: sessionNumber, start_at: toAppointmentIso(date, time), duration_minutes: 45 }) }); if (!response.ok) throw new Error(); } catch { setMessage('Session request saved on this device.'); } setBookings((current) => { const next = current.map((item) => { if (item.reference !== existingBooking.reference) return item; const updated = [...(item.sessions || [])]; if (nextIndex >= 0) updated[nextIndex] = session; else updated.push(session); return { ...item, sessions: updated }; }); localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next)); return next; }); setBooking({ reference: existingBooking.reference, total: 0, status: existingBooking.status, existing: true }); localStorage.removeItem(DRAFT_KEY); setSaving(false); setRedirectIn(5); };
  const createBooking = async () => { if (existingBooking) { await createExistingSession(); return; } setSaving(true); const total = service.price * pack; let created = { reference: `PT${Date.now().toString().slice(-6)}`, total, status: 'New' }; try { const response = await fetch(`${API}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_ref: personRef, booked_by_ref: personRef, service_id: service.id, package_size: pack, address_line: form.address, pincode: form.pincode, condition_notes: form.condition }) }); if (!response.ok) throw new Error(); const data = await response.json(); created = { reference: data.booking_ref, total: data.price_total, status: 'New' }; await fetch(`${API}/bookings/${created.reference}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_number: 1, start_at: toAppointmentIso(date, time), duration_minutes: 45 }) }); if (file) { const body = new FormData(); body.append('file', file); await fetch(`${API}/bookings/${created.reference}/documents`, { method: 'POST', body }); } } catch { setMessage('Demo booking saved on this device.'); } const record = { ...created, packageSize: pack, service: service.name, date: dateText(new Date(`${date}T12:00:00`)), time, patient: form.name, payment: payment === 'cod' ? 'Cash on delivery' : 'Online payment', sessions: Array.from({ length: pack }, (_, index) => ({ number: index + 1, date: index === 0 ? dateText(new Date(`${date}T12:00:00`)) : 'To be scheduled', time: index === 0 ? time : 'Choose later', status: index === 0 ? 'Waiting for confirmation' : 'Not scheduled' })) }; setBookings((current) => { const next = [record, ...current]; localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next)); return next; }); setBooking(created); localStorage.removeItem(DRAFT_KEY); setSaving(false); setRedirectIn(5); };
  const saveProfile = (next) => { setProfile(next); setForm((current) => ({ ...current, name: next.name, phone: next.phone })); localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); };

  const goHome = () => { setView('book'); setBooking(null); setStep(1); };
  const headerProps = { onHome: goHome, onBookings: () => setView('bookings'), onAppointments: () => setView('appointments'), onCancelled: () => setView('cancelled'), onProfile: () => setView('profile'), hasBookings: bookings.length > 0, hasConfirmed: bookings.some((item) => item.status === 'Confirmed') };
  const cancelBooking = (reference) => setBookings((current) => { const next = current.map((item) => item.reference === reference ? { ...item, status: 'Cancelled' } : item); localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next)); return next; });
  const updateRecord = (reference, change) => setBookings((current) => { const next = current.map((item) => item.reference === reference ? { ...item, ...change } : item); localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next)); return next; });
  const cancelSession = (reference, number) => setBookings((current) => { const next = current.map((item) => item.reference !== reference ? item : { ...item, sessions: item.sessions.map((session) => session.number === number ? { ...session, status: 'Cancelled' } : session) }); localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next)); return next; });
  const rescheduleSession = (reference, number, sessionChange) => setBookings((current) => { const next = current.map((item) => item.reference !== reference ? item : { ...item, sessions: item.sessions.map((session) => session.number === number ? { ...session, ...sessionChange, status: 'Waiting for confirmation' } : session) }); localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next)); return next; });
  const chooseExisting = (item) => { const match = services.find((serviceItem) => serviceItem.name === item.service); setExistingBooking(item); setService(match || null); setPack(1); setStep(1); setMessage(`${item.reference} selected. This session will not charge you again.`); };
  const startNewPackage = () => { if (existingBooking) { setExistingBooking(null); setMessage('Starting a new package booking.'); } };
  if (view === 'appointments') return <><Header {...headerProps} /><AppointmentsPanel bookings={bookings} onClose={() => setView('book')} onCancel={cancelSession} onReschedule={rescheduleSession} /></>;
  if (view === 'bookings' || view === 'cancelled') return <><Header {...headerProps} /><BookingsPanel bookings={bookings} cancelled={view === 'cancelled'} onClose={() => setView('book')} onCancel={cancelBooking} onSessionCancel={cancelSession} onReschedule={rescheduleSession} /></>;
  if (view === 'profile') return <><Header {...headerProps} /><ProfilePanel profile={profile} onSave={saveProfile} onClose={() => setView('book')} /></>;
  if (booking) return <Success booking={booking} service={service} date={date} time={time} redirectIn={redirectIn} onHome={goHome} onBookings={() => setView('bookings')} />;

  return <main><Header {...headerProps} /><section className="hero" id="top"><div><p className="eyebrow">PHYSIOTHERAPY AT HOME</p><h1>Move better.<br />Live easier.</h1><p>Qualified physiotherapy in the comfort of your home.</p><div className="trust"><span>✓ Trusted care</span><span>✓ Simple booking</span><span>✓ Pan-India support</span></div><p className="hero-quote">“We value you and our physios too.”</p></div><img className="hero-photo" src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80" alt="Physiotherapist helping a patient" /></section><section className="booking"><Progress step={step} onStep={setStep} />{message && <div className="message" role="status">{message}<button onClick={() => setMessage('')} aria-label="Close message">×</button></div>}{step === 1 && <VisitStep person={person} setPerson={setPerson} service={service} setService={setService} pack={pack} setPack={setPack} date={date} setDate={setDate} time={time} setTime={setTime} errors={errors} bookings={bookings} existingBooking={existingBooking} onExisting={chooseExisting} onNewPackage={startNewPackage} onNext={() => validateVisit() && setStep(2)} />}{step === 2 && <DetailsStep person={person} form={form} update={update} errors={errors} otp={otp} setOtp={setOtp} sentOtp={sentOtp} verified={verified} onSendOtp={sendOtp} onVerifyOtp={verifyOtp} file={file} setFile={setFile} onBack={() => setStep(1)} onNext={() => validateDetails() && setStep(3)} />}{step === 3 && <ReviewStep service={service} pack={pack} date={date} time={time} form={form} payment={payment} setPayment={setPayment} existingBooking={existingBooking} saving={saving} onBack={() => setStep(2)} onBook={createBooking} />}</section><footer>© 2026 Portea Medical <span>·</span> Quality care at home</footer></main>;
}
function Success({ booking, service, date, time, redirectIn, onHome, onBookings }) { return <><Header onHome={onHome} onBookings={onBookings} onAppointments={() => {}} onCancelled={() => {}} onProfile={() => {}} hasBookings /><section className="success"><div className="check">✓</div><p className="eyebrow">BOOKING CONFIRMED</p><h1>Your visit is booked.</h1><p>Our care team will call you shortly to assign a qualified physiotherapist.</p><div className="success-card"><div className="review-row"><span>Booking ID</span><b>{booking.reference}</b></div><div className="review-row"><span>Service</span><b>{service.name}</b></div><div className="review-row"><span>First visit</span><b>{dateText(new Date(`${date}T12:00:00`))}, {time}</b></div></div><p className="redirect">Going to your bookings in <strong>{redirectIn}</strong> seconds</p><div className="success-actions"><button className="primary" onClick={onHome}>Home page</button><button className="secondary" onClick={onBookings}>View bookings</button></div><p className="call">Questions? Call 1800 121 2323</p></section></>; }
