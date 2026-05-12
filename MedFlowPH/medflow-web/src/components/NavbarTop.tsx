// Reference export from medflow-cursor-export/Navbar.tsx — not wired into App layout.
// Landing scroll shortcuts live in Topbar.tsx only (no heroScrollLinks here).

import { AnimatePresence, motion } from 'framer-motion'
import { FlaskConical, Menu, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const routes = [
  { path: '/', label: 'Home' },
  { path: '/eda', label: 'Data Understanding' },
  { path: '/clustering', label: 'Clustering' },
  { path: '/comparison', label: 'Comparison' },
]

type NavbarTopProps = {
  darkMode: boolean
  toggleDarkMode: () => void
}

export function NavbarTop({ darkMode, toggleDarkMode }: NavbarTopProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      setScrolled(scrollTop > 40)
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <div
        className="fixed left-0 top-0 z-[60] h-0.5 bg-primary transition-all duration-100"
        style={{ width: `${progress}%` }}
        data-testid="scroll-progress-ref"
      />

      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-border bg-background/95 shadow-sm backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg font-bold text-foreground transition-colors hover:text-primary"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <FlaskConical className="h-5 w-5 text-primary" />
            MedFlow<span className="text-primary">PH</span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {routes.map((r) => (
              <NavLink
                key={r.path}
                to={r.path}
                end={r.path === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                  }`
                }
              >
                {r.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 top-14 z-40 border-b border-border bg-background/97 shadow-lg backdrop-blur-md"
          >
            <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-4 py-4">
              {routes.map((r) => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  end={r.path === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                    }`
                  }
                >
                  {r.label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
