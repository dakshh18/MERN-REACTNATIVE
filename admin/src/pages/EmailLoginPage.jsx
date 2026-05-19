import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useLocalAuth } from "../lib/localAuth.jsx";

function classifyIdentifier(input) {
  const s = input.trim();
  if (s.includes("@")) return { email: s.toLowerCase() };
  return { phoneNumber: s };
}

function EmailLoginPage() {
  const { loginStart } = useLocalAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) return setError("Enter your email or phone number.");
    if (!password) return setError("Enter your password.");

    setSubmitting(true);
    try {
      const ids = classifyIdentifier(identifier);
      const res = await loginStart({ ...ids, password });
      const qs = new URLSearchParams({
        purpose: "login",
        email: res.email || ids.email || "",
        phoneNumber: !ids.email ? ids.phoneNumber || "" : "",
      });
      navigate(`/verify-otp?${qs.toString()}`);
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        "Sign in failed. Try again.";
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
            <h1 className="text-2xl font-bold">Sign in with email</h1>
            <p className="text-sm opacity-70 -mt-1">
              We&apos;ll text and email you a 6-digit OTP.
            </p>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Email or phone</span>
              </div>
              <input
                type="text"
                placeholder="you@example.com or 9876543210"
                className="input input-bordered"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
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
                  placeholder="Your password"
                  className="input input-bordered join-item w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn join-item"
                  onClick={() => setShowPassword((s) => !s)}
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

            <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
              {submitting ? <span className="loading loading-spinner" /> : "Send OTP"}
            </button>

            <div className="text-sm text-center mt-2 opacity-80">
              No account yet?{" "}
              <Link to="/register" className="link link-primary font-semibold">
                Create one
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

export default EmailLoginPage;
