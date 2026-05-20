import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useLocalAuth } from "../lib/useLocalAuth.js";

function RegisterPage() {
  const { registerStart } = useLocalAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) return setError("Name must be at least 2 characters.");
    if (!form.email.includes("@")) return setError("Enter a valid email.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setSubmitting(true);
    try {
      const res = await registerStart({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate(
        `/verify-otp?purpose=register&email=${encodeURIComponent(res.email || form.email.trim())}`
      );
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        "Could not create account. Try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content w-full max-w-md">
        <div className="card w-full bg-base-100 shadow-xl">
          <form className="card-body" onSubmit={onSubmit}>
            <h1 className="text-2xl font-bold">Create admin account</h1>
            <p className="text-sm opacity-70 -mt-1">
              We&apos;ll send a 6-digit OTP to your email to verify it.
            </p>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Full name</span>
              </div>
              <input
                type="text"
                placeholder="Your name"
                className="input input-bordered"
                value={form.name}
                onChange={update("name")}
                autoComplete="name"
                required
              />
            </label>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Email</span>
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                className="input input-bordered"
                value={form.email}
                onChange={update("email")}
                autoComplete="email"
                required
              />
            </label>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Password</span>
              </div>
              <div className="join">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  className="input input-bordered join-item w-full"
                  value={form.password}
                  onChange={update("password")}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="btn join-item"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <div role="alert" className="alert alert-error text-sm py-2">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary mt-2"
              disabled={submitting}
            >
              {submitting ? <span className="loading loading-spinner" /> : "Create account"}
            </button>

            <div className="text-sm text-center mt-2 opacity-80">
              Already have an account?{" "}
              <Link to="/email-login" className="link link-primary font-semibold">
                Sign in
              </Link>
            </div>
            <div className="text-xs text-center opacity-60">
              or{" "}
              <Link to="/login" className="link">
                continue with Google / Apple via Clerk
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
