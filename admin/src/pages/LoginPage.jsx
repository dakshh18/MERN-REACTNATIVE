import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router";

function LoginPage() {
  return (
    <div className="h-screen hero flex flex-col items-center justify-center gap-6">
      <SignIn />
      {/* Email/password+OTP is an alternative entry point — Clerk OAuth above
          remains the primary admin sign-in path for existing users. */}
      <div className="text-sm text-base-content/70 flex items-center gap-2">
        <span>Prefer email and OTP?</span>
        <Link to="/email-login" className="link link-primary font-semibold">
          Sign in with email
        </Link>
        <span className="opacity-50">·</span>
        <Link to="/register" className="link link-primary font-semibold">
          Create account
        </Link>
      </div>
    </div>
  );
}
export default LoginPage;
