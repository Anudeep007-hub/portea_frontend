export default function Header({ onHome, onBookings, onAppointments, onCancelled, onProfile, hasBookings, hasConfirmed }) {
  return <header className="site-header">
    <button className="brand" onClick={onHome} aria-label="Go to Portea home"><span>+</span><strong>PORTEA</strong><small>MEDICAL</small></button>
    <nav className="main-nav" aria-label="Account navigation">
      <button className={`nav-button ${hasConfirmed ? 'confirmed' : hasBookings ? 'booked' : ''}`} onClick={onBookings}>My bookings</button>
      <button className="nav-button appointment-button" onClick={onAppointments}>Appointments</button>
      <button className="nav-button cancelled" onClick={onCancelled}>Cancelled</button>
      <button className="nav-button profile-button" onClick={onProfile}>My profile</button>
    </nav>
    <a className="help" href="tel:18001212323">Need help? <b>1800 121 2323</b></a>
  </header>;
}
