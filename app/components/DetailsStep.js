import { Back, Field, ErrorMessage } from "./Common";

export default function DetailsStep({
  person,
  form,
  update,
  errors,
  file,
  setFile,
  onBack,
  onNext,
}) {
  const patientWord = person === "myself" ? "you" : "your family member";
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
    >
      <Back onClick={onBack} />
      <h2>About {patientWord}</h2>
      <p className="subtext">We only ask for details needed for the visit.</p>
      <div className="form-grid">
        <Field
          label={
            person === "family"
              ? "Family member's full name"
              : "Patient's full name"
          }
          value={form.name || ""}
          onChange={(event) => update("name", event.target.value)}
          error={errors.name}
          placeholder="For example, Ramesh Kumar"
        />
        <Field
          label="Age"
          type="number"
          min="1"
          max="120"
          value={form.age || ""}
          onChange={(event) => update("age", event.target.value)}
          error={errors.age}
          placeholder="For example, 58"
        />
        <Field
          label="Mobile number"
          type="tel"
          value={form.phone || ""}
          readOnly
          error={errors.phone}
          placeholder="10-digit mobile number"
        />
        <div className="otp-box">
          <label>Mobile number verified</label>
          <p className="subtext">You are signed in. No OTP is needed again.</p>
          <ErrorMessage text={errors.otp} />
        </div>
        <Field
          wide
          label="Home address"
          value={form.address || ""}
          onChange={(event) => update("address", event.target.value)}
          error={errors.address}
          placeholder="House number, street, area"
        />
        <Field
          label="Pincode"
          value={form.pincode || ""}
          onChange={(event) =>
            update("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          error={errors.pincode}
          placeholder="6-digit pincode"
        />


        <div className="field wide">
          <label>
            What would you like help with? <small>(optional)</small>
          </label>
          <textarea
            value={form.condition || ""}
            onChange={(event) => update("condition", event.target.value)}
            placeholder="For example, knee pain while walking"
            maxLength="300"
          />
        </div>
      </div>
      <button className="primary" type="submit">
        Review booking
      </button>
    </form>
  );
}
