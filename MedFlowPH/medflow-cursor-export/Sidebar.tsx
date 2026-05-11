// Sidebar.tsx — table of contents for long pages, adapted for React Router
// Drop into: src/components/layout/Sidebar.tsx
// Works on any page — just pass the sections relevant to that page.

import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FlaskConical } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SidebarSection {
  id: string;      // matches the HTML element id for IntersectionObserver
  label: string;
}

interface SidebarProps {
  sections: SidebarSection[];
}

// ─── Landing page sections (used on "/") ─────────────────────────────────────

export const LANDING_SECTIONS: SidebarSection[] = [
  { id: "hero",              label: "Overview" },
  { id: "dataset-snapshot",  label: "Dataset Snapshot" },
  { id: "narratives",        label: "Guided Narratives" },
  { id: "references",        label: "References" },
];

// ─── EDA page sections (used on "/eda") ──────────────────────────────────────

export const EDA_SECTIONS: SidebarSection[] = [
  { id: "eda-overview",       label: "Overview" },
  { id: "missing-values",     label: "Missing Values" },
  { id: "rows-by-year",       label: "Records by Year" },
  { id: "correlation",        label: "Correlation" },
  { id: "distributions",      label: "Distributions" },
];

// ─── Clustering page sections (used on "/clustering") ────────────────────────

export const CLUSTERING_SECTIONS: SidebarSection[] = [
  { id: "clustering-overview",      label: "Overview" },
  { id: "feature-engineering",      label: "Feature Engineering" },
  { id: "pca",                      label: "PCA" },
  { id: "kmeans",                   label: "K-Means" },
  { id: "kmeans-interpretation",    label: "Interpretation" },
  { id: "dbscan",                   label: "DBSCAN" },
];

// ─── Comparison page sections (used on "/comparison") ────────────────────────

export const COMPARISON_SECTIONS: SidebarSection[] = [
  { id: "comparison-overview",  label: "Overview" },
  { id: "metrics",              label: "Metrics" },
  { id: "cluster-count",        label: "Cluster Count" },
  { id: "noise-share",          label: "Noise Share" },
  { id: "verdict",              label: "Verdict" },
];

// ─── Route quick-links shown at the bottom of the sidebar ────────────────────

const routeLinks = [
  { path: "/eda",         label: "EDA Gallery" },
  { path: "/clustering",  label: "Cluster Segmentation" },
  { path: "/comparison",  label: "Model Comparison" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar({ sections }: SidebarProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length === 0) return;

    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <aside
      className="hidden xl:flex flex-col fixed left-6 top-1/2 -translate-y-1/2 z-30 w-48 gap-0.5"
      aria-label="Page contents"
    >
      {/* Logo mark */}
      <div className="flex items-center gap-1.5 mb-3 px-3">
        <FlaskConical className="w-3.5 h-3.5 text-primary" />
        <span
          className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Contents
        </span>
      </div>

      {/* Current-page scroll links */}
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={`text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
            active === s.id
              ? "text-primary font-semibold bg-primary/8 border-l-2 border-primary pl-2.5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          data-testid={`sidebar-link-${s.id}`}
        >
          {s.label}
        </button>
      ))}

      {/* Divider + cross-route links */}
      <div className="h-px bg-border my-3 mx-3" />
      <p className="text-[10px] tracking-widest text-muted-foreground/50 uppercase px-3 mb-1">
        Pages
      </p>
      {routeLinks.map((r) => (
        <NavLink
          key={r.path}
          to={r.path}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-xs transition-colors ${
              isActive
                ? "text-primary font-semibold bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`
          }
          data-testid={`sidebar-route-${r.path.replace("/", "")}`}
        >
          {r.label}
        </NavLink>
      ))}
    </aside>
  );
}
