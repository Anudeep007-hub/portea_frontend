import { useState } from "react";
import { dateKey } from "./data";

const firstMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

export default function Calendar({
  selected,
  onSelect,
  availableDates = null,
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const month = new Date(
    firstMonth.getFullYear(),
    firstMonth.getMonth() + monthOffset,
    1,
  );
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const startDay = month.getDay();
  const cells = Array.from({ length: startDay + daysInMonth }, (_, index) =>
    index < startDay
      ? null
      : new Date(month.getFullYear(), month.getMonth(), index - startDay + 1),
  );
  const isAvailable = (date) => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Same-day visits are not offered. The backend also requires 3 hours' notice.
    if (!date || date < tomorrow) return false;

    const key = dateKey(date);
    return availableDates
      ? availableDates.includes(key)
      : date.getDate() % 6 !== 0;
  };

  return (
    <div className="calendar-wrap">
      <div className="calendar-head">
        <button
          type="button"
          className="month-arrow"
          disabled={monthOffset === 0}
          onClick={() => setMonthOffset(monthOffset - 1)}
          aria-label="Previous month"
        >
          ‹
        </button>
        <b>
          {month.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </b>
        <button
          type="button"
          className="month-arrow"
          disabled={monthOffset === 5}
          onClick={() => setMonthOffset(monthOffset + 1)}
          aria-label="Next month"
        >
          ›
        </button>
        <span>
          <i className="dot available" /> Available
        </span>
      </div>
      <div className="calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((date, index) => {
          const available = isAvailable(date);
          const key = date ? dateKey(date) : `empty-${index}`;
          const active = selected === key;
          return date ? (
            <button
              type="button"
              key={key}
              disabled={!available}
              className={`calendar-day ${available ? "available" : ""} ${active ? "selected" : ""}`}
              onClick={() => onSelect(active ? "" : key)}
              aria-label={`${date.toDateString()} ${available ? "available" : "unavailable"}`}
            >
              <b>{date.getDate()}</b>
            </button>
          ) : (
            <span className="calendar-empty" key={key} />
          );
        })}
      </div>
    </div>
  );
}
