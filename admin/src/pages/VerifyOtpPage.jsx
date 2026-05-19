import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useLocalAuth } from "../lib/localAuth.jsx";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyOtpPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const purpose = params.get("purpose") === "login" ? "login" : "register";
  const email = params.get("email") || "";
  const phoneNumber = params.get("phoneNumber") || "";
  const { verifyOtp, resendOtp } = useLocalAuth();

  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const onVerify = async (e) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP.");
    setSubmitting(true);
    try {
      await verifyOtp({
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        otp,
        purpose,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Could not verify. Check the code and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await resendOtp({
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        purpose,
      });
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.secondsLeft) setSecondsLeft(Number(data.secondsLeft));
      setError(data?.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const displayTarget = email || phoneNumber || "your email and phone";

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content w-full max-w-md">
        <div className="card w-full bg-base-100 shadow-xl">
          <form className="card-body" onSubmit={onVerify}>
            <h1 className="text-2xl font-bold">Enter OTP</h1>
            <p className="text-sm opacity-70 -mt-1">
              We sent a 6-digit code to your email and phone number.
            </p>
            <p className="text-xs opacity-60">{displayTarget}</p>

            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="input input-bordered text-center text-3xl font-bold tracking-[12px] py-7"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              required
            />

            {error && (
              <div role="alert" className="alert alert-error text-sm py-2">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary mt-2"
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? (
                <span className="loading loading-spinner" />
              ) : (
                "Verify & continue"
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm mt-2">
              <span className="opacity-70">Didn&apos;t get it?</span>
              <button
                type="button"
                onClick={onResend}
                disabled={secondsLeft > 0 || resending}
                className={`link ${
                  secondsLeft > 0 ? "opacity-50 cursor-not-allowed" : "link-primary"
                }`}
              >
                {secondsLeft > 0
                  ? `Resend in ${secondsLeft}s`
                  : resending
                    ? "Sending…"
                    : "Resend OTP"}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm mt-2"
              onClick={() => navigate(-1)}
            >
              Edit details
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtpPage;
