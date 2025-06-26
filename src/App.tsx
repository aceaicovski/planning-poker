import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Lobby from "./modules/Lobby.tsx";
import Room from "./modules/Room.tsx";
import NotFound from "./components/NotFound.tsx";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />

          <Route path="/room/:roomId" element={<Room />} />

          <Route path="/lobby" element={<Navigate to="/" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
