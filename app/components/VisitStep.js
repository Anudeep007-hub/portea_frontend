import Calendar from "./Calendar";
import { useEffect, useState } from "react";
import { ErrorMessage } from "./Common";
import { money, packages, fetchServices, timesForDate } from "./data";

const activeStatuses = ["Waiting for confirmation", "Confirmed", "Scheduled"];
const unusedStatuses = ["Not scheduled", "Cancelled"];


function packageState(item) {
  const sessions = item.sessions || [];
  const used = sessions.filter(
    (session) => !unusedStatuses.includes(session.status),
  ).length;
  const activeCount = sessions.filter((session) =>
    activeStatuses.includes(session.status),
  ).length;
  return {
    activeCount,
    left: Math.max((item.packageSize || sessions.length) - used, 0),
  };
}

export default function VisitStep({
  person,
  setPerson,
  service,
  setService,
  pack,
  setPack,
  date,
  setDate,
  time,
  setTime,
  errors,
  onNext,
  bookings,
  existingBooking,
  onExisting,
  onNewPackage,
  physioChoice,
  setPhysioChoice,
  preferredPhysio,
  setPreferredPhysio,
  physios,
  loadingPhysios,
  availability,
}) {

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch((error) => {
        console.error("Failed to load services:", error);
      })
      .finally(() => {
        setLoadingServices(false);
      });
  }, []);


  const packagesToShow = bookings.filter(
    (item) => item.status !== "Cancelled" && packageState(item).left > 0,
  );
  const isPreferredBooking = physioChoice === "PREFERRED_PHYSIO";
  const availableDates = isPreferredBooking
    ? availability?.dates?.length
      ? availability.dates
      : null
    : null;
  const availableTimes = isPreferredBooking
    ? availability?.slots?.[date] || []
    : timesForDate(date);

  const selectDate = (nextDate) => {
    setDate(nextDate);
    if (nextDate !== date) setTime("");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
    >
      <h2>Plan your visit</h2>
      <p className="subtext">
        Choose the care you need. You can change it later.
      </p>

      {existingBooking && (
        <div className="booking-context">
          <div>
            <b>Booking another session</b>
            <span>
              {existingBooking.reference} · {existingBooking.service} · Choose a
              new date and time
            </span>
            {existingBooking.physioChoice === "PREFERRED_PHYSIO" && (
              <small>
                Preferred physio: {existingBooking.preferredPhysio?.name}
              </small>
            )}
          </div>
          <button
            type="button"
            className="context-clear"
            onClick={onNewPackage}
          >
            Book a new package
          </button>
        </div>
      )}

      {packagesToShow.length > 0 && (
        <div className="existing-bookings">
          <b>Your packages</b>
          <div className="existing-package-grid">
            {packagesToShow.map((item) => (
              <ExistingPackage
                key={item.reference}
                item={item}
                onClick={() => onExisting(item)}
                selected={existingBooking?.reference === item.reference}
              />
            ))}
          </div>
        </div>
      )}

      {!existingBooking && (
        <>
          <h3>Who is the visit for?</h3>
          <div className="choice-row">
            <Choice
              active={person === "myself"}
              onClick={() => setPerson(person === "myself" ? "" : "myself")}
              title="For myself"
              text="I need physiotherapy"
            />
            <Choice
              active={person === "family"}
              onClick={() => setPerson(person === "family" ? "" : "family")}
              title="For a family member"
              text="I am booking for someone else"
            />
          </div>
        </>
      )}

      <h3>Choose a service</h3>


      <div className="service-grid">
        {loadingServices ? (
          <p>Loading services...</p>
        ) : (
          services.map((item) => (
            <button
              type="button"
              key={item.id}
              disabled={Boolean(existingBooking)}
              className={`service ${service?.id === item.id ? "selected" : ""
                } ${existingBooking ? "locked" : ""}`}
              onClick={() => {
                if (!existingBooking) {
                  setService(service?.id === item.id ? null : item);
                }
              }}
            >
              <span className="service-mark">+</span>
              <b>{item.name}</b>
              <span>{item.detail}</span>
              <em>From {money(item.price)} / visit</em>
            </button>
          ))
        )}
      </div>

      <ErrorMessage text={errors.service} />

      <h3>How many sessions?</h3>
      <div className="package-row">
        {packages.map((number) => (
          <button
            type="button"
            key={number}
            disabled={Boolean(existingBooking)}
            className={`${pack === number ? "selected" : ""} ${existingBooking ? "locked" : ""}`}
            onClick={() => {
              if (!existingBooking) {
                setPack(pack === number ? 0 : number);
              }
            }}
          >
            <b>
              {number} {number === 1 ? "session" : "sessions"}
            </b>
            <span>
              {number === 1
                ? "Start with one visit"
                : "Schedule the rest later"}
            </span>
          </button>
        ))}
      </div>

      {!existingBooking && (
        <PhysioChoice
          choice={physioChoice}
          setChoice={setPhysioChoice}
          selected={preferredPhysio}
          setSelected={setPreferredPhysio}
          physios={physios}
          loading={loadingPhysios}
        />
      )}
      <ErrorMessage text={errors.physio} />

      <h3>Choose date and time</h3>
      {isPreferredBooking && !preferredPhysio ? (
        <p className="slot-note">Choose a preferred physio first.</p>
      ) : (
        <>
          <Calendar
            selected={date}
            onSelect={selectDate}
            availableDates={availableDates}
          />
          {isPreferredBooking && (
            <p className="slot-note">
              Only {preferredPhysio?.name}’s available dates are shown.
            </p>
          )}
          <div className="time-row">
            {availableTimes.map((item) => (
              <button
                type="button"
                key={item}
                className={time === item ? "selected" : ""}
                onClick={() => setTime(time === item ? "" : item)}
              >
                {item}
              </button>
            ))}
          </div>
          {date && !availableTimes.length && (
            <p className="slot-note">
              No slots are available on this date. Choose another date.
            </p>
          )}
        </>
      )}
      <ErrorMessage text={errors.date} />
      <ErrorMessage text={errors.time} />
      <button className="primary" type="submit">
        Continue
      </button>
    </form>
  );
}

function PhysioChoice({
  choice,
  setChoice,
  selected,
  setSelected,
  physios,
  loading,
}) {
  return (
    <section className="physio-choice">
      <h3>Who should choose the physiotherapist?</h3>
      <p className="physio-help">
        Choose a preferred physio only when you know who you want. Otherwise,
        Portea will match the right person.
      </p>
      <div className="physio-options">
        <button
          type="button"
          className={`physio-option ${choice === "PORTEA_ASSIGNS" ? "selected" : ""}`}
          onClick={() => {
            setChoice("PORTEA_ASSIGNS");
            setSelected(null);
          }}
        >
          <span className="option-icon">✦</span>
          <span>
            <b>Let Portea choose</b>
            <small>Recommended · matched by care need and location</small>
          </span>
        </button>
        <button
          type="button"
          className={`physio-option ${choice === "PREFERRED_PHYSIO" ? "selected" : ""}`}
          onClick={() => setChoice("PREFERRED_PHYSIO")}
        >
          <span className="option-icon">⌕</span>
          <span>
            <b>Choose a preferred physio</b>
            <small>For a previous or known physiotherapist</small>
          </span>
        </button>
      </div>
      {choice === "PREFERRED_PHYSIO" && (
        <div className="physio-picker">
          <div className="picker-heading">
            <div>
              <b>Select your physiotherapist</b>
              <span>We will show only their free dates next.</span>
            </div>
            <span className="picker-count">{physios.length} available</span>
          </div>
          {loading ? (
            <p className="physio-loading">
              Finding available physiotherapists…
            </p>
          ) : physios.length ? (
            <div className="physio-grid">
              {physios.map((physio) => (
                <button
                  type="button"
                  key={physio.person_ref}
                  className={`physio-card ${selected?.person_ref === physio.person_ref ? "selected" : ""}`}
                  onClick={() => setSelected(physio)}
                >
                  <span className="physio-avatar">
                    {physio.name
                      .split(" ")
                      .filter((part) => !part.includes("."))
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span className="physio-copy">
                    <b>{physio.name}</b>
                    <small>
                      {physio.specialization || "Home physiotherapy"}
                    </small>
                  </span>
                  <span className="physio-check">✓</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="physio-loading">
              No physiotherapists are available right now. Let Portea choose for
              you.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ExistingPackage({ item, onClick, selected }) {
  const state = packageState(item);
  const blocked = state.activeCount >= 2;
  return (
    <button
      type="button"
      className={`existing-package ${selected ? "selected" : ""} ${blocked ? "blocked" : ""}`}
      disabled={blocked}
      onClick={onClick}
    >
      <strong>{item.reference}</strong>
      <span>{item.service}</span>
      <small>
        {item.physioChoice === "PREFERRED_PHYSIO"
          ? `Preferred: ${item.preferredPhysio?.name}`
          : "Portea will assign a physio"}{" "}
        · {blocked ? "one extra session is already booked" : "choose a slot"}
      </small>
    </button>
  );
}
function Choice({ active, onClick, title, text }) {
  return (
    <button
      type="button"
      className={`choice ${active ? "selected" : ""}`}
      onClick={onClick}
    >
      <b>{title}</b>
      <span>{text}</span>
    </button>
  );
}
