import Calendar from './Calendar';
import { ErrorMessage } from './Common';
import { money, packages, services, timesForDate } from './data';

const activeStatuses = ['Waiting for confirmation', 'Confirmed', 'Scheduled'];
const unusedStatuses = ['Not scheduled', 'Cancelled'];

function packageState(item) {
  const sessions = item.sessions || [];
  const used = sessions.filter((session) => !unusedStatuses.includes(session.status)).length;
  const activeCount = sessions.filter((session) => activeStatuses.includes(session.status)).length;
  const total = item.packageSize || sessions.length;
  return { activeCount, left: Math.max(total - used, 0) };
}

export default function VisitStep({ person, setPerson, service, setService, pack, setPack, date, setDate, time, setTime, errors, onNext, bookings, existingBooking, onExisting, onNewPackage }) {
  const packagesToShow = bookings.filter((item) => {
    const state = packageState(item);
    return item.status !== 'Cancelled' && state.left > 0;
  });

  const selectDate = (nextDate) => {
    setDate(nextDate);
    if (nextDate !== date) setTime('');
  };

  return <form onSubmit={(event) => { event.preventDefault(); onNext(); }}>
    <h2>Plan your visit</h2>
    <p className="subtext">Choose the care you need. You can change it later.</p>
    {existingBooking && <div className="booking-context"><div><b>Booking another session</b><span>{existingBooking.reference} · {existingBooking.service} · Choose a new date and time</span></div><button type="button" className="context-clear" onClick={onNewPackage}>Book a new package</button></div>}
    {packagesToShow.length > 0 && <div className="existing-bookings"><b>Your packages</b><div className="existing-package-grid">{packagesToShow.map((item) => <ExistingPackage key={item.reference} item={item} onClick={() => onExisting(item)} selected={existingBooking?.reference === item.reference} />)}</div></div>}
    <h3>Who is the visit for?</h3>
    <div className="choice-row"><Choice active={person === 'myself'} onClick={() => setPerson(person === 'myself' ? '' : 'myself')} title="For myself" text="I need physiotherapy" /><Choice active={person === 'family'} onClick={() => setPerson(person === 'family' ? '' : 'family')} title="For a family member" text="I am booking for someone else" /></div>
    <h3>Choose a service</h3>
    <div className="service-grid">{services.map((item) => <button type="button" key={item.id} disabled={Boolean(existingBooking)} className={`service ${service?.id === item.id ? 'selected' : ''} ${existingBooking ? 'locked' : ''}`} onClick={() => { onNewPackage(); setService(service?.id === item.id ? null : item); }}><span className="service-mark">+</span><b>{item.name}</b><span>{item.detail}</span><em>From {money(item.price)} / visit</em></button>)}</div>
    <ErrorMessage text={errors.service} />
    <h3>How many sessions?</h3>
    <div className="package-row">{packages.map((number) => <button type="button" key={number} disabled={Boolean(existingBooking)} className={`${pack === number ? 'selected' : ''} ${existingBooking ? 'locked' : ''}`} onClick={() => { onNewPackage(); setPack(pack === number ? 0 : number); }}><b>{number} {number === 1 ? 'session' : 'sessions'}</b><span>{number === 1 ? 'Start with one visit' : 'Schedule the rest later'}</span></button>)}</div>
    <h3>Choose date and time</h3>
    <Calendar selected={date} onSelect={selectDate} />
    <p className="slot-note">For today, we show only the next two hours.</p>
    <div className="time-row">{timesForDate(date).map((item) => <button type="button" key={item} className={time === item ? 'selected' : ''} onClick={() => setTime(time === item ? '' : item)}>{item}</button>)}</div>
    <ErrorMessage text={errors.date} /><ErrorMessage text={errors.time} />
    <button className="primary" type="submit">Continue</button>
  </form>;
}

function ExistingPackage({ item, onClick, selected }) {
  const state = packageState(item);
  const blocked = state.activeCount >= 2;
  return <button type="button" className={`existing-package ${selected ? 'selected' : ''} ${blocked ? 'blocked' : ''}`} disabled={blocked} onClick={onClick}><strong>{item.reference}</strong><span>{item.service}</span><small>{blocked ? 'One extra session is already booked' : state.activeCount === 1 ? `${state.left} sessions left · Book one extra slot` : `${state.left} sessions left · Choose a slot`}</small></button>;
}

function Choice({ active, onClick, title, text }) { return <button type="button" className={`choice ${active ? 'selected' : ''}`} onClick={onClick}><b>{title}</b><span>{text}</span></button>; }
