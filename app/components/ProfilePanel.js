import { useEffect, useState } from "react";

export default function ProfilePanel({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setName(profile.name || "");
    setPhone(profile.phone || "");
  }, [profile]);
  const save = (event) => {
    event.preventDefault();
    if (name.trim().length < 2 || !/^[6-9]\d{9}$/.test(phone)) {
      setMessage("Enter a name and valid 10-digit mobile number.");
      return;
    }
    onSave({ name: name.trim(), phone });
    setMessage("Profile saved on this device.");
  };
  return (
    <section className="account-panel">
      <button className="back" onClick={onClose}>
        Back to booking
      </button>
      <h2>My profile</h2>
      <p className="subtext">Keep your contact details up to date.</p>
      <form className="profile-form" onSubmit={save}>
        <label>
          Full name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Mobile number
          <input
            inputMode="numeric"
            maxLength="10"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
          />
        </label>
        {message && <small className="error">{message}</small>}
        <button className="primary" type="submit">
          Save profile
        </button>
      </form>
    </section>
  );
}
