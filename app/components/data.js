export const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const DRAFT_KEY = 'portea_frontend_draft';
export const BOOKINGS_KEY = 'portea_frontend_bookings';
export const PROFILE_KEY = 'portea_frontend_profile';
export const times = ['9:00 AM', '11:00 AM', '2:00 PM', '5:00 PM'];
export const timesForDate = (date) => {
  if (!date) return times;
  const today = new Date();
  if (date !== dateKey(today)) return times;
  const now = today.getHours() * 60 + today.getMinutes();
  const end = now + 120;
  return times.filter((time) => {
    const [clock, meridiem] = time.split(' ');
    let [hours, minutes] = clock.split(':').map(Number);
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    const value = hours * 60 + minutes;
    return value >= now && value <= end;
  });
};
export const services = [
  { id: 1, name: 'Back and neck pain', detail: 'Pain, stiffness or posture support', price: 799 },
  { id: 2, name: 'Post-surgery recovery', detail: 'Safe support after an operation', price: 999 },
  { id: 3, name: 'Elderly mobility', detail: 'Strength, balance and fall prevention', price: 899 }
];
export const packages = [1, 5, 10];
export const dateFor = (days) => new Date(Date.now() + days * 86400000);
export const dateKey = (date) => date.toISOString().slice(0, 10);
export const dateText = (date) => date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
export const money = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
