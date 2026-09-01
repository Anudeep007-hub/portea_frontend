import { useState } from "react";

export default function LoginPanel({
  onSendOtp,
  onResendOtp,
  onVerifyOtp,
  loading,
  onClose,
  destination,
}) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isBooking = destination === "book";

  const send = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    const result = await onSendOtp(phone);
    if (result?.error) {
      setError(result.error);
      return;
    }

    setError("");
    setNotice("OTP sent. Please check your mobile.");
    setSent(true);
  };

  const resend = async () => {
    const result = await onResendOtp(phone);
    if (result?.error) {
      setError(result.error);
      return;
    }

    setError("");
    setNotice("OTP sent again. Please check your mobile.");
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    const result = await onVerifyOtp(phone, otp);
    if (result?.error) setError(result.error);
  };

  return (
    <section className="account-panel login-panel">
      <button className="back" onClick={onClose}>
        Back
      </button>
      <h2>{isBooking ? "Start your booking" : "View my bookings"}</h2>
      <p className="subtext">
        Verify your mobile number once. You will stay signed in on this device.
      </p>

      <div className="profile-form">
        <label>
          Mobile number
          <input
            autoFocus
            inputMode="numeric"
            maxLength="10"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, ""))
            }
            placeholder="10-digit mobile number"
          />
        </label>

        {sent && (
          <label>
            OTP
            <input
              inputMode="numeric"
              maxLength="6"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, ""))
              }
              placeholder="6-digit OTP"
            />
          </label>
        )}

        {error && <small className="error">{error}</small>}
        {notice && <small className="file-note">{notice}</small>}

        <button
          className="primary"
          type="button"
          disabled={loading}
          onClick={sent ? verify : send}
        >
          {loading
            ? "Please wait…"
            : sent
              ? `Verify and ${isBooking ? "start booking" : "view bookings"}`
              : "Send OTP"}
        </button>

        {sent && (
          <button className="text-button" type="button" onClick={resend}>
            Resend OTP
          </button>
        )}
      </div>
    </section>
  );
}
