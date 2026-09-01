export function ErrorMessage({ text }) {
  return text ? (
    <small className="error" role="alert">
      {text}
    </small>
  ) : null;
}
export function Field({ label, error, wide, ...props }) {
  return (
    <div className={`field ${wide ? "wide" : ""}`}>
      <label>{label}</label>
      <input {...props} /> <ErrorMessage text={error} />
    </div>
  );
}
export function Back({ onClick }) {
  return (
    <button type="button" className="back" onClick={onClick}>
      Back
    </button>
  );
}
export function Row({ label, value }) {
  return (
    <div className="review-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
export function Progress({ step, onStep }) {
  return (
    <div className="progress">
      {["Choose visit", "Your details", "Review and pay"].map(
        (label, index) => (
          <button
            type="button"
            className={step >= index + 1 ? "done" : ""}
            key={label}
            disabled={index + 1 > step}
            onClick={() => onStep(index + 1)}
          >
            <b>{index + 1}</b>
            <span>{label}</span>
          </button>
        ),
      )}
    </div>
  );
}
