import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmEmail, resendOtp } from "../api.js";
import { digitsOnly, isEmail, isOtp } from "../validate.js";
import Field from "../components/Field.jsx";
import Notice from "../components/Notice.jsx";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({ type: "info", text: location.state?.email ? "We emailed you a 6-digit code." : "" });
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const found = {};
    if (!isEmail(email.trim())) found.email = "Enter a valid email address.";
    if (!isOtp(code)) found.otp = "Enter the 6-digit code.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setNotice({ type: "info", text: "" });
    try {
      await confirmEmail(email.trim(), code);
      navigate("/login", { state: { notice: "Email verified. You can log in now." } });
    } catch (err) {
      setErrors({ otp: err.fieldErrors.otp ?? err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (!isEmail(email.trim())) return setErrors({ email: "Enter a valid email address." });
    setErrors({});
    setResending(true);
    try {
      await resendOtp(email.trim());
      setNotice({ type: "success", text: "A new code was sent." });
    } catch (err) {
      setNotice({ type: "error", text: err.message }); // 409 includes how long to wait
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[600px] py-10">
      <div className="card">
        <p className="eyebrow mb-3">Almost there</p>
        <h1 className="mb-8 text-4xl">Verify your email</h1>
        <Notice type={notice.type}>{notice.text}</Notice>
        <form onSubmit={submit} noValidate>
          <Field label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
          <Field label="Code" name="otp" value={code} onChange={(e) => setCode(digitsOnly(e.target.value))} error={errors.otp} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Confirming…" : "Confirm"}</button>
            <button type="button" className="btn-secondary" onClick={resend} disabled={resending}>{resending ? "Sending…" : "Send a new code"}</button>
          </div>
        </form>
        <p className="mt-6 text-sm">Already verified? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
