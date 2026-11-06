import { useState } from "react";
import { confirmTwoFactorOtp, requestTwoFactorOtp } from "../api.js";
import { digitsOnly, isOtp } from "../validate.js";
import Field from "./Field.jsx";
import Notice from "./Notice.jsx";

// The profile API does not return the current 2FA state, so there is no toggle:
// two explicit actions, and the server tells us if the state already matches.
export default function TwoFactorCard() {
  const [pending, setPending] = useState(null); // null | 0 | 1
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ type: "info", text: "" });

  async function start(status) {
    setBusy(true);
    setError("");
    setNotice({ type: "info", text: "" });
    try {
      await requestTwoFactorOtp(status);
      setPending(status);
      setCode("");
      setNotice({ type: "info", text: "We emailed you a 6-digit code." });
    } catch (err) {
      // e.g. 400 "two factor authentication already active"
      setNotice({ type: "info", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e) {
    e.preventDefault();
    if (!isOtp(code)) return setError("Enter the 6-digit code.");
    setBusy(true);
    setError("");
    try {
      await confirmTwoFactorOtp(code, pending);
      setNotice({
        type: "success",
        text: pending === 1 ? "Two-factor authentication is on." : "Two-factor authentication is off.",
      });
      setPending(null);
      setCode("");
    } catch (err) {
      setError(err.fieldErrors.otp ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" aria-labelledby="twofa-title">
      <h2 id="twofa-title" className="mb-2 text-2xl tracking-[-0.02em]">Two-factor authentication</h2>
      <p className="mb-5 text-sm">When on, logging in also needs a code we email you.</p>
      <Notice type={notice.type}>{notice.text}</Notice>

      {pending === null ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" disabled={busy} onClick={() => start(1)}>Enable</button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => start(0)}>Disable</button>
        </div>
      ) : (
        <form onSubmit={confirm} noValidate>
          <Field
            label={pending === 1 ? "Code to enable 2FA" : "Code to disable 2FA"}
            name="twofa-code"
            value={code}
            onChange={(e) => setCode(digitsOnly(e.target.value))}
            error={error}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Checking…" : "Confirm"}</button>
            <button type="button" className="btn-secondary" onClick={() => { setPending(null); setError(""); }}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
