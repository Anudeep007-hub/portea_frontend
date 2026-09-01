// Backend endpoint – can be overridden by Vite env var `VITE_API_URL`
// When deploying, set VITE_API_URL=https://portea-backend-1.onrender.com
export const API =
  import.meta.env.VITE_API_URL || "http://localhost:8000";
export const DRAFT_KEY = "portea_frontend_draft";
export const BOOKINGS_KEY = "portea_frontend_bookings";
export const PROFILE_KEY = "portea_frontend_profile";
export const SESSION_KEY = "portea_patient_session";
export const times = ["9:00 AM", "11:00 AM", "2:00 PM", "5:00 PM"];
export const timesForDate = (date) => {
  if (!date) return times;
  const today = new Date();
  if (date !== dateKey(today)) return times;
  const now = today.getHours() * 60 + today.getMinutes();
  const end = now + 120;
  return times.filter((time) => {
    const [clock, meridiem] = time.split(" ");
    let [hours, minutes] = clock.split(":").map(Number);
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    const value = hours * 60 + minutes;
    return value >= now && value <= end;
  });
};


export const fetchServices = async () => {
  const response = await fetch(`${API}/services`);

  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }

  const data = await response.json();

  return data.map((service) => ({
    id: service.id,
    slug: service.slug,
    name: service.name,
    detail: service.description,
    price: service.price_per_session,
  }));
};

export const fetchPhysios = async () => {
  const response = await fetch(`${API}/physios`);

  if (!response.ok) {
    throw new Error(`Failed to fetch physiotherapists: ${response.status}`);
  }

  return response.json();
};


export const packages = [1,2,3,4,5,6,7,8,9,10];
export const dateFor = (days) => new Date(Date.now() + days * 86400000);
export const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const dateText = (date) =>
  date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
export const money = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
