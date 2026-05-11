// Navbar.tsx — adapted for React Router v6
// Drop into: src/components/layout/Navbar.tsx
// Install deps if missing: pnpm add framer-motion lucide-react

import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun, FlaskConical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const routes = [
  { path: "/", label: "Home" },
  { path: "/eda", label: "EDA" },
  { path: "/clustering", label: "Clustering" },
  { path: "/comparison", label: "Comparison" },
];

// Sections used only on the landing page for smooth-scroll
const heroScrollLinks = [
  { id: "dataset-snapshot", label: "Dataset" },
  { id: "narratives", label: "Narratives" },
  { id: "references", label: "References" },
];

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Navbar({ darkMode, toggleDarkMode }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setScrolled(scrollTop > 40);
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-primary z-[60] transition-all duration-100"
        style={{ width: `${progress}%` }}
        data-testid="scroll-progress"
      />

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-bold text-lg text-foreground hover:text-primary transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            data-testid="nav-logo"
          >
            <FlaskConical className="w-5 h-5 text-primary" />
            MedFlow<span className="text-primary">PH</span>
          </button>

          {/* Desktop nav — route links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {routes.map((r) => (
              <NavLink
                key={r.path}
                to={r.path}
                end={r.path === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "text-primary font-semibold bg-primary/8"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`
                }
                data-testid={`nav-link-${r.label.toLowerCase()}`}
              >
                {r.label}
              </NavLink>
            ))}

            {/* Divider */}
            <span className="w-px h-5 bg-border mx-1" />

            {/* Scroll links — only visible on home */}
            {heroScrollLinks.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                data-testid={`nav-scroll-${s.id}`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
              data-testid="button-dark-mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle mobile menu"
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 left-0 right-0 z-40 bg-background/97 backdrop-blur-md border-b border-border shadow-lg"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 gap-1">
              {routes.map((r) => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  end={r.path === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      isActive
                        ? "text-primary font-semibold bg-primary/8"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    }`
                  }
                >
                  {r.label}
                </NavLink>
              ))}
              {heroScrollLinks.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className="text-left px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
