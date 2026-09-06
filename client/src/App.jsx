import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import RoomPage from "./pages/RoomPage/RoomPage";
import Footer from "./components/Footer/Footer";
import styles from "./App.module.css";

function App() {

  return (
    <BrowserRouter>
      <div className={styles.appShell}>
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rooms/:roomId" element={<RoomPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
      </BrowserRouter>
  )
}

export default App