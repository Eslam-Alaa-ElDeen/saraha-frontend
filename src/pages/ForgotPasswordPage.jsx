import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearTokens, requestPasswordReset, resetPassword } from "../api.js";
import { digitsOnly, isEmail, isOtp, isPassword } from "../validate.js";
import Field from "../components/Field.jsx";
import Notice from "../components/Notice.jsx";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "reset"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({ type: "info", text: "" });
  const [submitting, setSubmitting] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    if (!isEmail(email.trim())) return setErrors({ email: "Enter a valid email address." });
    setErrors({});
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setNotice({ type: "info", text: "If this email has an account, a 6-digit code was sent." });
      setStep("reset");
    } catch (err) {
      // 409 means a code is still active: let the user continue with it.
      if (err.status === 409) {
        setNotice({ type: "info", text: err.message });
        setStep("reset");
      } else {
        setErrors({ email: err.fieldErrors.email ?? err.message });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReset(e) {
    e.preventDefault();
    const found = {};
    if (!isEmail(email.trim())) found.email = "Enter a valid email address.";
    if (!isOtp(code)) found.otp = "Enter the 6-digit code.";
    if (!isPassword(newPassword)) found.newPassword = "Password must be 8-128 characters.";
    else if (confirm !== newPassword) found.confirm = "Passwords do not match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await resetPassword({ email: email.trim(), otp: code, newPassword }); // `confirm` is never sent
      clearTokens();
      navigate("/login", { replace: true, state: { notice: "Password updated. Log in with your new password." } });
    } catch (err) {
      const f = { ...err.fieldErrors };
      if (!Object.keys(f).length) f.otp = err.message;
      setErrors(f);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[600px] py-10">
      <div className="card">
        <p className="eyebrow mb-3">{step === "email" ? "Forgot password" : "Reset password"}</p>
        <h1 className="mb-8 text-4xl">{step === "email" ? "Get a reset code" : "Choose a new password"}</h1>
        <Notice type={notice.type}>{notice.text}</Notice>

        {step === "email" ? (
          <form onSubmit={sendCode} noValidate>
            <Field label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
            <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? "Sending…" : "Send code"}</button>
            <p className="mt-6 text-sm">
              <button type="button" className="nav-link !normal-case !tracking-normal underline" onClick={() => setStep("reset")}>I already have a code</button>
            </p>
          </form>
        ) : (
          <form onSubmit={submitReset} noValidate>
            <Field label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
            <Field label="Code" name="otp" value={code} onChange={(e) => setCode(digitsOnly(e.target.value))} error={errors.otp} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
            <Field label="New password" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={errors.newPassword} autoComplete="new-password" hint="8 to 128 characters." />
            <Field label="Confirm new password" name="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving…" : "Update password"}</button>
              <button type="button" className="btn-secondary" onClick={() => { setStep("email"); setErrors({}); }}>Back</button>
            </div>
          </form>
        )}
        <p className="mt-6 text-sm"><Link to="/login">Back to log in</Link></p>
      </div>
    </div>
  );
}
