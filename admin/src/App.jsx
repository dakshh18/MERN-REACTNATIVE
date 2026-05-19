import { Navigate, Route, Routes } from "react-router";
import LoginPage from "./pages/LoginPage";
import EmailLoginPage from "./pages/EmailLoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import { useAuth } from "@clerk/clerk-react";
import { useLocalAuth } from "./lib/localAuth.jsx";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardLayout from "./layouts/DashboardLayout";

import PageLoader from "./components/PageLoader";

function App() {
  const { isSignedIn: clerkSignedIn, isLoaded: clerkLoaded } = useAuth();
  const { isSignedIn: localSignedIn } = useLocalAuth();

  if (!clerkLoaded) return <PageLoader />;

  // Either auth path counts as signed in.
  const signedIn = clerkSignedIn || localSignedIn;

  return (
    <Routes>
      <Route
        path="/login"
        element={signedIn ? <Navigate to={"/dashboard"} /> : <LoginPage />}
      />
      <Route
        path="/email-login"
        element={signedIn ? <Navigate to={"/dashboard"} /> : <EmailLoginPage />}
      />
      <Route
        path="/register"
        element={signedIn ? <Navigate to={"/dashboard"} /> : <RegisterPage />}
      />
      <Route
        path="/verify-otp"
        element={signedIn ? <Navigate to={"/dashboard"} /> : <VerifyOtpPage />}
      />

      <Route path="/" element={signedIn ? <DashboardLayout /> : <Navigate to={"/login"} />}>
        <Route index element={<Navigate to={"dashboard"} />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
      </Route>
    </Routes>
  );
}

export default App;
