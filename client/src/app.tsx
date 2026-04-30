import { Navigate, Route, Routes } from "react-router";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { GamePage } from "@/pages/game";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { ProfilePage } from "@/pages/profile.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!(isAuthenticated || isGuest)) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <div className="min-h-svh bg-zinc-900">
      <Navbar />
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<HomePage />} path="/" />
        <Route element={<Navigate replace to="/" />} path="/home" />
        <Route element={<Navigate replace to="/" />} path="/lobby" />
        <Route
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
          path="/profile"
        />
        <Route
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
          path="/game/:roomId"
        />
      </Routes>
    </div>
  );
}

export default App;
