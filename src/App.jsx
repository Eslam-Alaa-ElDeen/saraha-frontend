import { Link, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import PublicMessagePage from "./pages/PublicMessagePage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import MessageDetailPage from "./pages/MessageDetailPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

function NotFound() {
  return (
    <div className="mx-auto max-w-[600px] py-24 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="text-4xl">Page not found</h1>
      <p className="mt-4">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary mt-8">Back home</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/u/:recipientId" element={<PublicMessagePage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:messageId" element={<MessageDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
