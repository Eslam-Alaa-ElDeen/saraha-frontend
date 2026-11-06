import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { signInWithGoogle, signup } from "../api.js";
import { checkSignup } from "../validate.js";
import Field from "../components/Field.jsx";
import GoogleButton from "../components/GoogleButton.jsx";
import Notice from "../components/Notice.jsx";
import ParticleSphere from "../components/ParticleSphere.jsx";

const EMPTY = { firstName: "", lastName: "", email: "", password: "", phone: "", gender: "", DOB: "" };

export default function SignupPage() {
  const { isLoggedIn, signIn } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoggedIn) return <Navigate to="/messages" replace />;

  const set = (name) => (e) => {
    const raw = e.target.value;
    const value = name === "phone" ? raw.replace(/\D/g, "").slice(0, 11) : raw;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    const found = checkSignup(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    // Only documented fields are sent (the backend rejects unknown ones).
    const body = {
      userName: `${values.firstName} ${values.lastName}`, // backend splits on ONE space
      email: values.email.trim(),
      password: values.password,
      phone: values.phone,
    };
    if (values.gender !== "") body.gender = Number(values.gender);
    if (values.DOB) body.DOB = values.DOB;

    setSubmitting(true);
    try {
      await signup(body); // response data contains the user document: ignored on purpose
      navigate("/verify-email", { state: { email: body.email } });
    } catch (err) {
      const f = { ...err.fieldErrors };
      if (f.userName) { f.firstName = f.userName; delete f.userName; }
      if (err.status === 409) f.email = err.message;
      setErrors(f);
      if (!Object.keys(f).length) setFormError(err.message);
      else if (err.status !== 409) setFormError("Please correct the highlighted fields.");
    } finally {
      setSubmitting(false);
    }
  }

  async function google(idToken) {
    setFormError("");
    try {
      signIn(await signInWithGoogle(idToken));
      navigate("/messages", { replace: true });
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1100px] items-center gap-10 py-10 md:grid-cols-2">
      <div className="card">
        <p className="eyebrow mb-3">Create account</p>
        <h1 className="mb-8 text-4xl">Join Saraha</h1>
        <Notice type="error">{formError}</Notice>

        <form onSubmit={submit} noValidate>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="First name" name="firstName" value={values.firstName} onChange={set("firstName")} error={errors.firstName} autoComplete="given-name" />
            <Field label="Last name" name="lastName" value={values.lastName} onChange={set("lastName")} error={errors.lastName} autoComplete="family-name" />
          </div>
          <Field label="Email" name="email" type="email" value={values.email} onChange={set("email")} error={errors.email} autoComplete="email" />
          <Field label="Password" name="password" type="password" value={values.password} onChange={set("password")} error={errors.password} autoComplete="new-password" hint="8 to 128 characters." />
          <Field label="Phone" name="phone" type="tel" inputMode="numeric" value={values.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" hint="11 digits." />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Gender (optional)" name="gender" as="select" value={values.gender} onChange={set("gender")} error={errors.gender}>
              <option value="">Prefer not to say</option>
              <option value="0">Male</option>
              <option value="1">Female</option>
            </Field>
            <Field label="Date of birth (optional)" name="DOB" type="date" max={new Date().toISOString().slice(0, 10)} value={values.DOB} onChange={set("DOB")} error={errors.DOB} autoComplete="bday" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <GoogleButton onToken={google} />
        <p className="mt-6 text-sm">Already have an account? <Link to="/login">Log in</Link></p>
      </div>

      <ParticleSphere className="pointer-events-none hidden aspect-square w-full md:block" />
    </div>
  );
}
