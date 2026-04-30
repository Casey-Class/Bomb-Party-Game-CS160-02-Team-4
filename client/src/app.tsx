import { Route, Routes, Navigate } from "react-router";
import { GamePage } from "@/pages/game";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { LobbyPage } from "@/pages/lobby";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<LoginPage />} path="/" />
      <Route 
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } 
        path="/home" 
      />
      <Route 
        element={
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        } 
        path="/game/lobby" 
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
  );
}

export default App;
