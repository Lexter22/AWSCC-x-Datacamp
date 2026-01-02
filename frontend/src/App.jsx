import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./Home.jsx";
import ApplicationForm from "./ApplicationForm.jsx";
import Success from "./Success.jsx";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="glass-container">
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          ></header>

          <main className="page">
            <h1 style={{ margin: "12px 0 6px" }}>
              AWS Cloud Club - Frizz × DataCamp Donates
            </h1>
            <p style={{ marginTop: 0, color: "var(--muted)" }}></p>

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/apply" element={<ApplicationForm />} />
              <Route path="/success" element={<Success />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
