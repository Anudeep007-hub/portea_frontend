import { Back, Row } from "./Common";
import { dateText, money } from "./data";

export default function ReviewStep({
  service,
  pack,
  date,
  time,
  form,
  payment,
  setPayment,
  existingBooking,
  physioChoice,
  preferredPhysio,
  saving,
  onBack,
  onBook,
}) {
  const addingSession = Boolean(existingBooking);
  const bookingChoice = addingSession
    ? existingBooking.physioChoice
    : physioChoice;
  const bookingPhysio = addingSession
    ? existingBooking.preferredPhysio
    : preferredPhysio;
  const serviceName = service?.name || existingBooking?.service || "Selected service";
  const servicePrice = Number(service?.price || 0);
  const totalPrice = servicePrice * (Number(pack) || 1);

  return (
    <section>
      <Back onClick={onBack} />
      <h2>Check your booking</h2>
      <p className="subtext">Please check the details before confirming.</p>
      <div className="review">
        <Row label="Service" value={serviceName} />
        <Row
          label="Physiotherapist"
          value={
            bookingChoice === "PREFERRED_PHYSIO"
              ? bookingPhysio?.name
              : "Portea will assign the right physio"
          }
        />
        <Row
          label="First visit"
          value={`${dateText(new Date(`${date}T12:00:00`))}, ${time}`}
        />
        <Row label="Patient" value={`${form.name}, ${form.age} years (${form.phone})`} />
        <Row
          label="Address"
          value={
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              {form.address}, {form.pincode}{" "}
              <small className="map-link">Open in Google Maps</small>
            </a>
          }
        />
        <hr />
        <Row
          label={
            addingSession
              ? "Existing package"
              : `${pack} ${pack === 1 ? "session" : "sessions"}`
          }
          value={
            addingSession
              ? existingBooking.reference
              : money(totalPrice)
          }
        />
        {addingSession ? (
          <div className="no-charge">
            <b>No payment needed</b>
            <span>This session is part of your existing package.</span>
          </div>
        ) : (
          <>
            <Row label="Travel and service fee" value="Included" />
            <div className="total">
              <b>Total to pay</b>
              <strong>{money(totalPrice)}</strong>
            </div>
          </>
        )}
      </div>
      {!addingSession && (
        <div className="payment-choice">
          <h3>How would you like to pay?</h3>
          <button
            type="button"
            className={payment === "online" ? "selected" : ""}
            onClick={() => setPayment(payment === "online" ? "" : "online")}
          >
            <b>Pay online</b>
            <span>UPI, card or net banking</span>
          </button>
          <button
            type="button"
            className={payment === "cod" ? "selected" : ""}
            onClick={() => setPayment(payment === "cod" ? "" : "cod")}
          >
            <b>Cash on delivery</b>
            <span>Pay the care team at your visit</span>
          </button>
        </div>
      )}
      <p className="safe">
        Your details are used only to arrange this home visit.
      </p>
      <button
        className="primary"
        disabled={saving || (!addingSession && !payment)}
        onClick={onBook}
      >
        {saving
          ? "Confirming booking..."
          : addingSession
            ? "Book another session"
            : payment === "cod"
              ? "Book with cash on delivery"
              : `Pay ${money(totalPrice)} and book`}
      </button>
      {payment === "online" && !addingSession && (
        <p className="payment-note">
          Demo payment only. No money will be charged.
        </p>
      )}
    </section>
  );
}
