// App-wrapper-example.tsx
// ────────────────────────────────────────────────────────────────
// Shows how to wire the Navbar + dark-mode state into your existing
// React Router v6 App.tsx WITHOUT breaking your current routes.
//
// Copy only the parts you don't already have — do not replace your
// entire App.tsx with this file.
// ────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ── Your existing page imports (keep as-is) ──────────────────────
import LandingPage    from "./pages/LandingPage";
import EdaPage        from "./pages/EdaPage";
import ClusteringPage from "./pages/ClusteringPage";
import ComparisonPage from "./pages/ComparisonPage";

// ── New layout components (copy from this export) ────────────────
import { Navbar }  from "./components/layout/Navbar";
import { Sidebar, LANDING_SECTIONS } from "./components/layout/Sidebar";

// ────────────────────────────────────────────────────────────────

export default function App() {
  // ── Dark mode — persisted to localStorage ──────────────────────
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("medflow-theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("medflow-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("medflow-theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // ────────────────────────────────────────────────────────────────
  return (
    <BrowserRouter>
      {/*
        Navbar sits outside <Routes> so it persists across all pages.
        Pass darkMode + toggle so the moon/sun button works everywhere.
      */}
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/*
        Sidebar is optional — include it on long pages only.
        On the landing page, pass LANDING_SECTIONS.
        On /eda, import EDA_SECTIONS and pass those instead.
        You can also render it inside each page component instead of here.
      */}
      <Sidebar sections={LANDING_SECTIONS} />

      {/*
        pt-14 compensates for the fixed 56px navbar.
        xl:pl-56 compensates for the 224px fixed sidebar on xl screens.
        Adjust these values if your navbar or sidebar height/width differs.
      */}
      <main className="pt-14 xl:pl-56">
        <Routes>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/eda"        element={<EdaPage />} />
          <Route path="/clustering" element={<ClusteringPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

// ────────────────────────────────────────────────────────────────
// PER-PAGE SIDEBAR USAGE EXAMPLE
// ────────────────────────────────────────────────────────────────
//
// If you prefer to control the sidebar per-page instead of in App:
//
//   // In EdaPage.tsx:
//   import { Sidebar, EDA_SECTIONS } from "@/components/layout/Sidebar";
//
//   export default function EdaPage() {
//     return (
//       <>
//         <Sidebar sections={EDA_SECTIONS} />
//         <div className="xl:pl-56">
//           <section id="eda-overview"> ... </section>
//           <section id="missing-values"> ... </section>
//         </div>
//       </>
//     );
//   }
