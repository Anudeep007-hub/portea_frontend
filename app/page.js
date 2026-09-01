import { useEffect, useState } from "react";
import Header from "./components/Header";
import VisitStep from "./components/VisitStep";
import DetailsStep from "./components/DetailsStep";
import ReviewStep from "./components/ReviewStep";
import BookingsPanel from "./components/BookingsPanel";
import ProfilePanel from "./components/ProfilePanel";
import AppointmentsPanel from "./components/AppointmentsPanel";
import LoginPanel from "./components/LoginPanel";
import Calendar from "./components/Calendar";
import { Progress } from "./components/Common";
import {
  API,
  BOOKINGS_KEY,
  DRAFT_KEY,
  PROFILE_KEY,
  SESSION_KEY,
  dateText,
  services,
  timesForDate,
} from "./components/data";

const blank = {
  name: "",
  age: "",
  phone: "",
  address: "",
  pincode: "",
  condition: "",
};
const demoPhysios = [
  {
    person_ref: "DEMO_ANJALI",
    name: "Dr. Anjali Rao",
    specialization: "Back pain and mobility",
  },
  {
    person_ref: "DEMO_KARTHIK",
    name: "Dr. Karthik Menon",
    specialization: "Post-surgery rehabilitation",
  },
];
const demoAvailability = () => {
  const slots = {};
  for (let day = 1; day <= 90; day += 1) {
    const date = new Date(Date.now() + day * 86400000);
    if (date.getDay() !== 0 && date.getDate() % 6 !== 0)
      slots[date.toISOString().slice(0, 10)] = [
        "9:00 AM",
        "11:00 AM",
        "2:00 PM",
        "5:00 PM",
      ];
  }
  return { dates: Object.keys(slots), slots };
};
const toAppointmentIso = (date, time) => {
  const [clock, meridiem] = time.split(" ");
  let [hours, minutes] = clock.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

export default function Home() {
  const [view, setView] = useState("login");
  const [loginDestination, setLoginDestination] = useState("book");
  const [step, setStep] = useState(1);
  const [person, setPerson] = useState("myself");
  const [service, setService] = useState(null);
  const [pack, setPack] = useState(1);
  const [existingBooking, setExistingBooking] = useState(null);
  const [physioChoice, setPhysioChoice] = useState("PORTEA_ASSIGNS");
  const [preferredPhysio, setPreferredPhysio] = useState(null);
  const [physios, setPhysios] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loadingPhysios, setLoadingPhysios] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [personRef, setPersonRef] = useState("");
  const [file, setFile] = useState(null);
  const [payment, setPayment] = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState({});
  const [saving, setSaving] = useState(false);
  const [redirectIn, setRedirectIn] = useState(0);
  const [session, setSession] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      const savedBookings = JSON.parse(
        localStorage.getItem(BOOKINGS_KEY) || "[]",
      );
      const savedProfile = JSON.parse(
        localStorage.getItem(PROFILE_KEY) || "{}",
      );
      const savedSession = JSON.parse(
        localStorage.getItem(SESSION_KEY) || "null",
      );
      if (draft) {
        setStep(draft.step || 1);
        setPerson(draft.person || "myself");
        setService(draft.service || null);
        setPack(draft.pack || 1);
        setDate(draft.date || "");
        setTime(draft.time || "");
        setForm({ ...blank, ...draft.form });
        setPhysioChoice(draft.physioChoice || "PORTEA_ASSIGNS");
        setPreferredPhysio(draft.preferredPhysio || null);
      }
      setBookings(savedBookings);
      setProfile(savedProfile);
      if (savedProfile.phone)
        setForm((current) => ({
          ...current,
          phone: savedProfile.phone,
          name: savedProfile.name || current.name,
        }));
      if (savedSession?.token && savedSession?.personRef) {
        setSession(savedSession);
        setPersonRef(savedSession.personRef);
        setVerified(true);
        setForm((current) => ({
          ...current,
          phone: savedSession.phone || current.phone,
        }));
        setView("book");
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        step,
        person,
        service,
        pack,
        date,
        time,
        form,
        physioChoice,
        preferredPhysio,
      }),
    );
  }, [
    step,
    person,
    service,
    pack,
    date,
    time,
    form,
    physioChoice,
    preferredPhysio,
  ]);
  useEffect(() => {
    if (!redirectIn) return;
    const timer = setInterval(() => setRedirectIn((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [redirectIn]);
  useEffect(() => {
    if (redirectIn === 0 && booking) setView("bookings");
  }, [redirectIn, booking]);
  useEffect(() => {
    if (view === "bookings" || view === "appointments") syncBookingStatuses();
  }, [view, session]);
  useEffect(() => {
    if (physioChoice !== "PREFERRED_PHYSIO" || existingBooking) return;
    setLoadingPhysios(true);
    fetch(`${API}/physios`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setPhysios(data))
      .catch(() => setPhysios(demoPhysios))
      .finally(() => setLoadingPhysios(false));
  }, [physioChoice, existingBooking]);
  useEffect(() => {
    if (physioChoice !== "PREFERRED_PHYSIO" || !preferredPhysio) {
      setAvailability(null);
      return;
    }
    fetch(`${API}/physios/${preferredPhysio.person_ref}/availability?days=90`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setAvailability)
      .catch(() => setAvailability(demoAvailability()));
  }, [physioChoice, preferredPhysio]);

  const authHeaders = () =>
    session?.token ? { Authorization: `Bearer ${session.token}` } : {};
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    if (key === "phone" && !session) setVerified(false);
  };
  const choosePhysioMode = (choice) => {
    setPhysioChoice(choice);
    setDate("");
    setTime("");
    if (choice === "PORTEA_ASSIGNS") setPreferredPhysio(null);
  };
  const choosePreferredPhysio = (physio) => {
    setPreferredPhysio(physio);
    setDate("");
    setTime("");
  };
  const validateVisit = () => {
    const next = {};
    if (!existingBooking && !person) next.person = "Choose who the visit is for.";
    if (!existingBooking && !service)
      next.service = "Please choose the care you need.";
    if (!existingBooking && !pack) next.pack = "Choose a session option.";
    if (!existingBooking && physioChoice === "PREFERRED_PHYSIO" && !preferredPhysio)
      next.physio = "Choose your preferred physiotherapist.";
    if (!date) next.date = "Choose an available date.";
    if (!time) next.time = "Please choose a time.";
    setErrors(next);
    const valid = !Object.keys(next).length;
    if (!valid) window.scrollTo({ top: 0, behavior: "smooth" });
    return valid;
  };
  const validateDetails = () => {
    const next = {};
    const phone = (form.phone || "").replace(/\s/g, "");
    if (!form.name || form.name.trim().length < 2)
      next.name = "Enter the patient’s full name.";
    if (
      !form.age ||
      !/^(?:[1-9]|[1-9][0-9]|1[01][0-9]|120)$/.test(String(form.age))
    )
      next.age = "Enter an age from 1 to 120.";
    if (!/^[6-9]\d{9}$/.test(phone))
      next.phone = "Enter a valid 10-digit mobile number.";
    if (!form.address || form.address.trim().length < 8)
      next.address =
        "Enter the house number and street (at least 8 characters).";
    if (!form.pincode || !/^\d{6}$/.test(form.pincode))
      next.pincode = "Enter a valid 6-digit pincode.";
    if (!verified && !session) next.otp = "Please verify the mobile number.";
    if (file && file.size > 5 * 1024 * 1024)
      next.file = "Choose a file smaller than 5 MB.";
    setErrors(next);
    const valid = !Object.keys(next).length;
    if (!valid) window.scrollTo({ top: 0, behavior: "smooth" });
    return valid;
  };

  const sendOtpRequest = async (phone) => {
    try {
      const response = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) throw new Error(await apiError(response));
      const data = await response.json();
      setSentOtp(data.debug_otp || "");
      return {};
    } catch (error) {
      return {
        error: error.message || "We could not send an OTP. Please try again.",
      };
    }
  };
  const saveSession = (data, phone) => {
    const next = {
      token: data.access_token,
      personRef: data.person_ref,
      phone,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    setPersonRef(data.person_ref);
    setVerified(true);
    setForm((current) => ({ ...current, phone }));
    setProfile((current) => ({
      ...current,
      phone,
      name: current.name || form.name,
    }));
    return next;
  };
  const sendOtp = async () => {
    const phone = form.phone.replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErrors((current) => ({
        ...current,
        phone: "Enter a valid mobile number first.",
      }));
      return;
    }
    const result = await sendOtpRequest(phone);
    if (result.error) setMessage(result.error);
    else setMessage("OTP sent. Enter it below.");
  };
  const verifyOtp = async () => {
    if (!/^\d{4}$/.test(otp)) {
      setErrors((current) => ({ ...current, otp: "Enter the 4-digit OTP." }));
      return;
    }
    try {
      const response = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone.replace(/\s/g, ""), otp }),
      });
      if (!response.ok) throw new Error(await apiError(response));
      const data = await response.json();
      saveSession(data, form.phone.replace(/\s/g, ""));
      setMessage(
        "Mobile number verified. You will not need another OTP on this device.",
      );
    } catch (error) {
      setErrors((current) => ({
        ...current,
        otp: error.message || "That OTP is not correct.",
      }));
    }
  };

  const apiError = async (response) => {
    const body = await response.json().catch(() => ({}));
    return body.detail || "We could not save this booking. Please try again.";
  };

  const createExistingSession = async () => {
    setSaving(true);
    const sessions = existingBooking.sessions || [];
    const nextIndex = sessions.findIndex((session) =>
      ["Not scheduled", "Cancelled"].includes(session.status),
    );
    const sessionNumber =
      nextIndex >= 0 ? sessions[nextIndex].number : sessions.length + 1;
    const session = {
      number: sessionNumber,
      isoDate: date,
      date: dateText(new Date(`${date}T12:00:00`)),
      time,
      status: "Waiting for confirmation",
    };
    try {
      const response = await fetch(
        `${API}/bookings/${existingBooking.reference}/appointments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            session_number: sessionNumber,
            start_at: toAppointmentIso(date, time),
            duration_minutes: 45,
          }),
        },
      );
      if (!response.ok) throw new Error(await apiError(response));
      const data = await response.json();
      session.apptRef = data.appt_ref;
    } catch (error) {
      setMessage(error.message || "We could not schedule this session.");
      setSaving(false);
      return;
    }
    setBookings((current) => {
      const next = current.map((item) => {
        if (item.reference !== existingBooking.reference) return item;
        const updated = [...(item.sessions || [])];
        if (nextIndex >= 0) updated[nextIndex] = session;
        else updated.push(session);
        return { ...item, sessions: updated };
      });
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
      return next;
    });
    setBooking({
      reference: existingBooking.reference,
      total: 0,
      status: existingBooking.status,
      existing: true,
    });
    localStorage.removeItem(DRAFT_KEY);
    setSaving(false);
    setRedirectIn(5);
  };

  const createBooking = async () => {
    if (existingBooking) return createExistingSession();
    if (!service) {
      setErrors((current) => ({
        ...current,
        service: "Please choose the care you need.",
      }));
      setMessage("Please choose the care you need.");
      setStep(1);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        patient_ref: personRef,
        booked_by_ref: personRef,
        service_id: service.id,
        package_size: pack,
        address_line: form.address,
        pincode: form.pincode,
        condition_notes: form.condition,
        physio_choice: physioChoice,
        preferred_physio_ref: preferredPhysio?.person_ref || null,
        start_at: toAppointmentIso(date, time),
        duration_minutes: 45,
      };

      const response = await fetch(`${API}/bookings/with-first-appointment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await apiError(response));

      const data = await response.json();

      if (file) {
        const body = new FormData();
        body.append("file", file);
        await fetch(`${API}/bookings/${data.booking_ref}/documents`, {
          method: "POST",
          body,
        });
      }

      const created = {
        reference: data.booking_ref,
        total: data.price_total,
        status: "New",
      };
      const record = {
        ...created,
        packageSize: pack,
        service: service.name,
        date: dateText(new Date(`${date}T12:00:00`)),
        time,
        patient: form.name,
        payment: payment === "cod" ? "Cash on delivery" : "Online payment",
        physioChoice,
        preferredPhysio,
        sessions: Array.from({ length: pack }, (_, index) => ({
          number: index + 1,
          apptRef: index === 0 ? data.appt_ref : null,
          isoDate: index === 0 ? date : null,
          date:
            index === 0
              ? dateText(new Date(`${date}T12:00:00`))
              : "To be scheduled",
          time: index === 0 ? time : "Choose later",
          status: index === 0 ? "Waiting for confirmation" : "Not scheduled",
        })),
      };

      setBookings((current) => {
        const next = [record, ...current];
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
        return next;
      });

      setBooking(created);
      localStorage.removeItem(DRAFT_KEY);
      setRedirectIn(5);
    } catch (error) {
      setMessage(error.message || "We could not save this booking.");
    } finally {
      setSaving(false);
    }
  };
  const syncBookingStatuses = async () => {
    if (session) {
      try {
        await loadMyBookings();
      } catch {
        /* The dashboard keeps its last successful data. */
      }
      return;
    }
    const statusLabel = {
      Pending: "Waiting for confirmation",
      Confirmed: "Confirmed",
      Completed: "Completed",
      Cancelled: "Cancelled",
    };
    const updated = await Promise.all(
      bookings.map(async (item) => {
        try {
          const response = await fetch(`${API}/bookings/${item.reference}`, {
            headers: authHeaders(),
          });
          if (!response.ok) return item;
          const data = await response.json();
          const appointments = Object.fromEntries(
            data.appointments.map((appointment) => [
              appointment.session_number,
              appointment,
            ]),
          );
          return {
            ...item,
            sessions: (item.sessions || []).map((session) => {
              const appointment = appointments[session.number];
              return appointment
                ? {
                    ...session,
                    apptRef: appointment.appt_ref,
                    isoDate: appointment.start_at.slice(0, 10),
                    status:
                      statusLabel[appointment.status] || appointment.status,
                  }
                : session;
            }),
          };
        } catch {
          return item;
        }
      }),
    );
    setBookings(updated);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  };
  const loadMyBookings = async (activeSession = session) => {
    if (!activeSession?.token) return [];
    const response = await fetch(`${API}/bookings/patient/mine`, {
      headers: { Authorization: `Bearer ${activeSession.token}` },
    });
    if (response.status === 401) {
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
      setVerified(false);
      throw new Error(
        "Your sign-in has expired. Please verify your mobile number again.",
      );
    }
    if (!response.ok) throw new Error(await apiError(response));
    const data = await response.json();
    const statusLabel = {
      Pending: "Waiting for confirmation",
      Confirmed: "Confirmed",
      Completed: "Completed",
      Cancelled: "Cancelled",
    };
    const records = data.bookings.map((item) => ({
      reference: item.booking_ref,
      total: item.price_total,
      status: item.status,
      packageSize: item.package_size,
      service: item.service_name,
      patient: item.patient_name,
      patientPhone: item.patient_phone,
      booker: item.booker_name,
      bookerPhone: item.booker_phone,
      physioChoice: item.physio_choice,
      preferredPhysio: item.preferred_physio_ref
        ? {
            person_ref: item.preferred_physio_ref,
            name: item.preferred_physio_name,
          }
        : null,
      sessions: Array.from({ length: item.package_size }, (_, index) => {
        const appointment = item.appointments.find(
          (value) => value.session_number === index + 1,
        );
        return appointment
          ? {
              number: index + 1,
              apptRef: appointment.appt_ref,
              isoDate: appointment.start_at.slice(0, 10),
              date: dateText(new Date(appointment.start_at)),
              time: new Date(appointment.start_at).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              }),
              status: statusLabel[appointment.status] || appointment.status,
            }
          : {
              number: index + 1,
              date: "To be scheduled",
              time: "Choose later",
              status: "Not scheduled",
            };
      }),
    }));
    setBookings(records);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(records));
    return records;
  };
  const openBookings = async () => {
    // Always require OTP verification before viewing bookings
    setLoginDestination("bookings");
    setView("login");
  };
  const loginSendOtp = async (phone) => {
    setLoginLoading(true);
    const result = await sendOtpRequest(phone);
    setLoginLoading(false);
    return result;
  };
  const loginResendOtp = async (phone) => {
    setLoginLoading(true);

    try {
      const response = await fetch(`${API}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) throw new Error(await apiError(response));
      return {};
    } catch (error) {
      return { error: error.message || "We could not resend the OTP." };
    } finally {
      setLoginLoading(false);
    }
  };
  const loginVerifyOtp = async (phone, code) => {
    setLoginLoading(true);

    try {
      const response = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      if (!response.ok) throw new Error(await apiError(response));

      const data = await response.json();
      const next = saveSession(data, phone);
      setForm((current) => ({ ...current, phone }));
      await loadMyBookings(next);
      setView(loginDestination);
      return {};
    } catch (error) {
      return { error: error.message || "That OTP is not correct." };
    } finally {
      setLoginLoading(false);
    }
  };
  const saveProfile = async (next) => {
    setProfile(next);
    setForm((current) => ({ ...current, name: next.name, phone: next.phone }));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    if (session && personRef) {
      try {
        await fetch(`${API}/persons/${personRef}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ name: next.name, phone: next.phone }),
        });
      } catch (err) {
        console.error("Failed to sync profile:", err);
      }
    }
  };

  const goHome = () => {
    setBooking(null);
    setStep(1);
    setLoginDestination("book");
    setView(session ? "book" : "login");
  };
  const openLogin = (destination) => {
    setLoginDestination(destination);
    setView("login");
  };
  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setSession(null);
    setVerified(false);
    setForm(blank);
    setProfile({});
    setBookings([]);
    setBooking(null);
    setStep(1);
    setOtp("");
    setSentOtp("");
    setMessage("");
    setPersonRef("");
    setLoginDestination("book");
    setView("login");  // Directly show login without waiting for state update
  };
  const headerProps = {
    onHome: goHome,
    onBookings: openBookings,
    onAppointments: () =>
      session ? setView("appointments") : openLogin("appointments"),
    onCancelled: () =>
      session ? setView("cancelled") : openLogin("cancelled"),
    onProfile: () => (session ? setView("profile") : openLogin("profile")),
    onLogout: session ? logout : null,
    hasBookings: bookings.length > 0,
    hasConfirmed: bookings.some((item) => item.status === "Confirmed"),
  };
  const cancelBooking = (reference) =>
    setBookings((current) => {
      const next = current.map((item) =>
        item.reference === reference ? { ...item, status: "Cancelled" } : item,
      );
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
      return next;
    });
  const updateRecord = (reference, change) =>
    setBookings((current) => {
      const next = current.map((item) =>
        item.reference === reference ? { ...item, ...change } : item,
      );
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
      return next;
    });
  const canManageSession = (session) =>
    !["Completed", "Cancelled"].includes(session.status);
  const cancelSession = async (reference, number) => {
    const bookingToUpdate = bookings.find(
      (item) => item.reference === reference,
    );
    const session = bookingToUpdate?.sessions?.find(
      (item) => item.number === number,
    );
    if (!session || !canManageSession(session)) return;
    if (session.apptRef) {
      try {
        const response = await fetch(
          `${API}/appointments/${session.apptRef}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ status: "Cancelled" }),
          },
        );
        if (!response.ok) throw new Error();
      } catch {
        setMessage("We could not cancel this session. Please try again.");
        return;
      }
    }
    setBookings((current) => {
      const next = current.map((item) =>
        item.reference !== reference
          ? item
          : {
              ...item,
              sessions: item.sessions.map((itemSession) =>
                itemSession.number === number
                  ? { ...itemSession, status: "Cancelled" }
                  : itemSession,
              ),
            },
      );
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
      return next;
    });
    setMessage("Session cancelled. You can now schedule another session.");
  };
  const rescheduleSession = (reference, number, sessionChange) => {
    setRescheduleMode({ reference, number, current: sessionChange });
    setRescheduleDate("");
    setRescheduleTime("");
    setMessage("Choose a new date and time below.");
  };
  const chooseExisting = (item) => {
    const match = services.find(
      (serviceItem) => serviceItem.name === item.service,
    );
    setExistingBooking(item);
    setService(match || null);
    setPack(1);
    setPhysioChoice(item.physioChoice || "PORTEA_ASSIGNS");
    setPreferredPhysio(item.preferredPhysio || null);
    setStep(1);
    setMessage(
      `${item.reference} selected. This session will not charge you again.`,
    );
  };
  const scheduleNextSession = (item) => {
    chooseExisting(item);
    setDate("");
    setTime("");
    setView("book");
  };
  const startNewPackage = () => {
    setExistingBooking(null);
    setPhysioChoice("PORTEA_ASSIGNS");
    setPreferredPhysio(null);
    setAvailability(null);
    setMessage("Starting a new package booking.");
  };
  const submitReschedule = async () => {
    if (!rescheduleMode || !rescheduleDate || !rescheduleTime) {
      setMessage("Please select a new date and time.");
      return;
    }
    const { reference, number } = rescheduleMode;
    const bookingToUpdate = bookings.find(
      (item) => item.reference === reference,
    );
    const session = bookingToUpdate?.sessions?.find(
      (item) => item.number === number,
    );
    if (!session || !canManageSession(session) || !session.apptRef) {
      setMessage("This session cannot be rescheduled.");
      return;
    }
    try {
      const response = await fetch(
        `${API}/appointments/${session.apptRef}/reschedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            session_number: number,
            start_at: toAppointmentIso(rescheduleDate, rescheduleTime),
            duration_minutes: 45,
          }),
        },
      );
      if (!response.ok) throw new Error(await apiError(response));
      setMessage("Session rescheduled! Our team will confirm the new time.");
      setRescheduleMode(null);
      setRescheduleDate("");
      setRescheduleTime("");
      await loadMyBookings();
    } catch (error) {
      setMessage(error.message || "Could not reschedule. Please try again.");
    }
  };
  if (view === "appointments") {
    if (rescheduleMode) {
      return (
        <>
          <Header {...headerProps} />
          <section className="account-panel">
            <button className="back" onClick={() => setRescheduleMode(null)}>
              Back to appointments
            </button>
            <h2>Reschedule appointment</h2>
            <p className="subtext">Pick a new date and time for this session.</p>
            {message && <p className="message">{message}</p>}
            <h3>Choose new date</h3>
            <Calendar
              selected={rescheduleDate}
              onSelect={(d) => {
                setRescheduleDate(d);
                setRescheduleTime("");
              }}
            />
            {rescheduleDate && (
              <>
                <h3>Choose new time</h3>
                <div className="time-grid">
                  {timesForDate(rescheduleDate).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`time-option ${rescheduleTime === t ? "selected" : ""}`}
                      onClick={() => setRescheduleTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
            {rescheduleDate && rescheduleTime && (
              <button className="primary" onClick={submitReschedule}>
                Confirm reschedule
              </button>
            )}
          </section>
        </>
      );
    }
    return (
      <>
        <Header {...headerProps} />
        <AppointmentsPanel
          bookings={bookings}
          onClose={() => setView("book")}
          onCancel={cancelSession}
          onReschedule={rescheduleSession}
        />
      </>
    );
  }
  if (view === "bookings" || view === "cancelled")
    return (
      <>
        <Header {...headerProps} />
        <BookingsPanel
          bookings={bookings}
          cancelled={view === "cancelled"}
          onClose={() => setView("book")}
          onCancel={cancelBooking}
          onSessionCancel={cancelSession}
          onReschedule={rescheduleSession}
          onScheduleNext={scheduleNextSession}
        />
      </>
    );
  if (view === "profile")
    return (
      <>
        <Header {...headerProps} />
        <ProfilePanel
          profile={profile}
          onSave={saveProfile}
          onClose={() => setView("book")}
        />
      </>
    );
  if (view === "login")
    return (
      <>
        <Header {...headerProps} />
        <LoginPanel
          destination={loginDestination}
          loading={loginLoading}
          onSendOtp={loginSendOtp}
          onResendOtp={loginResendOtp}
          onVerifyOtp={loginVerifyOtp}
          onClose={goHome}
        />
      </>
    );
  if (booking)
    return (
      <Success
        booking={booking}
        service={service}
        date={date}
        time={time}
        redirectIn={redirectIn}
        onHome={goHome}
        onBookings={() => setView("bookings")}
      />
    );

  const goToStep = (nextStep) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main>
      <Header {...headerProps} />
      <section className="hero" id="top">
        <div>
          <p className="eyebrow">PHYSIOTHERAPY AT HOME</p>
          <h1>
            Move better.
            <br />
            Live easier.
          </h1>
          <p>Qualified physiotherapy in the comfort of your home.</p>
          <div className="trust">
            <span>✓ Trusted care</span>
            <span>✓ Simple booking</span>
            <span>✓ Pan-India support</span>
          </div>
          <p className="hero-quote">“We value you and our physios too.”</p>
        </div>
        <img
          className="hero-photo"
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80"
          alt="Physiotherapist helping a patient"
        />
      </section>
      <section className="booking">
        <Progress step={step} onStep={goToStep} />
        {message && (
          <div className="message" role="status">
            {message}
            <button onClick={() => setMessage("")} aria-label="Close message">
              ×
            </button>
          </div>
        )}
        {step === 1 && (
          <VisitStep
            person={person}
            setPerson={setPerson}
            service={service}
            setService={setService}
            pack={pack}
            setPack={setPack}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            errors={errors}
            bookings={bookings}
            existingBooking={existingBooking}
            onExisting={chooseExisting}
            onNewPackage={startNewPackage}
            onNext={() => validateVisit() && goToStep(2)}
            physioChoice={physioChoice}
            setPhysioChoice={choosePhysioMode}
            preferredPhysio={preferredPhysio}
            setPreferredPhysio={choosePreferredPhysio}
            physios={physios}
            loadingPhysios={loadingPhysios}
            availability={availability}
          />
        )}
        {step === 2 && (
          <DetailsStep
            person={person}
            form={form}
            update={update}
            errors={errors}
            file={file}
            setFile={setFile}
            onBack={() => goToStep(1)}
            onNext={() => validateDetails() && goToStep(3)}
          />
        )}
        {step === 3 && (
          <ReviewStep
            service={service}
            pack={pack}
            date={date}
            time={time}
            form={form}
            payment={payment}
            setPayment={setPayment}
            existingBooking={existingBooking}
            physioChoice={physioChoice}
            preferredPhysio={preferredPhysio}
            saving={saving}
            onBack={() => goToStep(2)}
            onBook={createBooking}
            opacity="1"
          />
        )}
      </section>
      <footer>
        © 2026 Portea Medical <span>·</span> Quality care at home
      </footer>
    </main>
  );
}
function Success({
  booking,
  service,
  date,
  time,
  redirectIn,
  onHome,
  onBookings,
}) {
  return (
    <>
      <Header
        onHome={onHome}
        onBookings={onBookings}
        onAppointments={() => {}}
        onCancelled={() => {}}
        onProfile={() => {}}
        hasBookings
      />
      <section className="success">
        <div className="check">✓</div>
        <p className="eyebrow">BOOKING CONFIRMED</p>
        <h1>Your visit is booked.</h1>
        <p>
          Our care team will call you shortly to assign a qualified
          physiotherapist.
        </p>
        <div className="success-card">
          <div className="review-row">
            <span>Booking ID</span>
            <b>{booking.reference}</b>
          </div>
          <div className="review-row">
            <span>Service</span>
            <b>{service.name}</b>
          </div>
          <div className="review-row">
            <span>First visit</span>
            <b>
              {dateText(new Date(`${date}T12:00:00`))}, {time}
            </b>
          </div>
        </div>
        <p className="redirect">
          Going to your bookings in <strong>{redirectIn}</strong> seconds
        </p>
        <div className="success-actions">
          <button className="primary" onClick={onHome}>
            Home page
          </button>
          <button className="secondary" onClick={onBookings}>
            View bookings
          </button>
        </div>
        <p className="call">Questions? Call 1800 121 2323</p>
      </section>
    </>
  );
}
