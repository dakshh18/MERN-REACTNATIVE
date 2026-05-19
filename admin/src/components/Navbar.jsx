import { UserButton, useAuth } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router";
import { useLocalAuth } from "../lib/useLocalAuth.js";

import {
  ClipboardListIcon,
  HomeIcon,
  LogOutIcon,
  PanelLeftIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "lucide-react";

// eslint-disable-next-line
export const NAVIGATION = [
  { name: "Dashboard", path: "/dashboard", icon: <HomeIcon className="size-5" /> },
  { name: "Products", path: "/products", icon: <ShoppingBagIcon className="size-5" /> },
  { name: "Orders", path: "/orders", icon: <ClipboardListIcon className="size-5" /> },
  { name: "Customers", path: "/customers", icon: <UsersIcon className="size-5" /> },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn: clerkSignedIn } = useAuth();
  const { isSignedIn: localSignedIn, user: localUser, signOut: localSignOut } =
    useLocalAuth();

  return (
    <div className="navbar w-full bg-base-300">
      <label htmlFor="my-drawer" className="btn btn-square btn-ghost" aria-label="open sidebar">
        <PanelLeftIcon className="size-5" />
      </label>

      <div className="flex-1 px-4">
        <h1 className="text-xl font-bold">
          {NAVIGATION.find((item) => item.path === location.pathname)?.name || "Dashboard"}
        </h1>
      </div>

      {/* Clerk user → Clerk's UserButton with built-in menu.
          Local user → our own little avatar + sign-out button. */}
      <div className="mr-5 flex items-center gap-3">
        {clerkSignedIn && <UserButton />}
        {!clerkSignedIn && localSignedIn && (
          <>
            <span className="text-sm opacity-80 hidden sm:inline">
              {localUser?.name || localUser?.email}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                localSignOut();
                navigate("/login");
              }}
              aria-label="Sign out"
            >
              <LogOutIcon className="size-4" />
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;
