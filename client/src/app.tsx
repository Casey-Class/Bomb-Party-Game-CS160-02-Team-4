import { Route, Routes } from "react-router";
import { GamePage } from "@/pages/game";
import { HomePage } from "@/pages/home";

export function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<GamePage />} path="/game/:roomId" />
    </Routes>
  );
}

export default App;
