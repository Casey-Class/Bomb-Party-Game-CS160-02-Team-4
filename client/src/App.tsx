import { Routes, Route } from "react-router"
import { HomePage } from "@/pages/home"
import { GamePage } from "@/pages/game"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game/:roomId" element={<GamePage />} />
    </Routes>
  )
}

export default App
