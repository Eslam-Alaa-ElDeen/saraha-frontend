import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { confirmTwoFactorLogin, login, signInWithGoogle } from "../api.js";
import { digitsOnly, isEmail, isOtp } from "../validate.js";
import Field from "../components/Field.jsx";
import GoogleButton from "../components/GoogleButton.jsx";
import Notice from "../components/Notice.jsx";
import ParticleSphere from "../components/ParticleSphere.jsx";

export default function LoginPage() {
  const { isLoggedIn, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState("credentials"); // "credentials" | "code"
  const [values, setValues] = useState({ email: "", password: "" });
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoggedIn) return <Navigate to="/messages" replace />;

  const target = location.state?.from?.pathname ?? "/messages";
  const finish = (tokens) => {
    signIn(tokens);
    navigate(target, { replace: true });
  };

  async function submitCredentials(e) {
    e.preventDefault();
    setFormError("");
    const found = {};
    if (!isEmail(values.email.trim())) found.email = "Enter a valid email address.";
    if (!values.password) found.password = "Enter your password.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const tokens = await login({ email: values.email.trim(), password: values.password });
      if (tokens) finish(tokens);
      else setStep("code"); // no tokens: a 2FA code was emailed
    } catch (err) {
      if (Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCode(e) {
    e.preventDefault();
    setFormError("");
    if (!isOtp(code)) return setErrors({ otp: "Enter the 6-digit code." });
    setErrors({});
    setSubmitting(true);
    try {
      finish(await confirmTwoFactorLogin(values.email.trim(), code));
    } catch (err) {
      setErrors({ otp: err.fieldErrors.otp ?? err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function google(idToken) {
    setFormError("");
    try {
      finish(await signInWithGoogle(idToken));
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1100px] items-center gap-10 py-10 md:grid-cols-2">
      <div className="card">
        <p className="eyebrow mb-3">{step === "code" ? "Two-factor check" : "Welcome back"}</p>
        <h1 className="mb-8 text-4xl">{step === "code" ? "Enter your code" : "Log in"}</h1>
        <Notice type="success">{location.state?.notice}</Notice>
        <Notice type="error">{formError}</Notice>

        {step === "credentials" ? (
          <>
            <form onSubmit={submitCredentials} noValidate>
              <Field label="Email" name="email" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} error={errors.email} autoComplete="email" />
              <Field label="Password" name="password" type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} error={errors.password} autoComplete="current-password" />
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? "Logging in…" : "Log in"}
              </button>
            </form>
            <GoogleButton onToken={google} />
            <p className="mt-6 text-sm"><Link to="/forgot-password">Forgot password?</Link></p>
            <p className="mt-2 text-sm">New here? <Link to="/signup">Create an account</Link></p>
          </>
        ) : (
          <form onSubmit={submitCode} noValidate>
            <p className="mb-5 text-sm">We emailed a 6-digit code to {values.email.trim()}.</p>
            <Field label="Code" name="otp" value={code} onChange={(e) => setCode(digitsOnly(e.target.value))} error={errors.otp} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Checking…" : "Confirm"}</button>
              <button type="button" className="btn-secondary" onClick={() => { setStep("credentials"); setCode(""); setErrors({}); }}>Back</button>
            </div>
          </form>
        )}
      </div>

      <ParticleSphere className="pointer-events-none hidden aspect-square w-full md:block" />
    </div>
  );
}
