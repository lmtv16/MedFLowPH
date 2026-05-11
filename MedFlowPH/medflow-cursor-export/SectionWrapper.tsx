// SectionWrapper.tsx — scroll-triggered fade-in section container
// Drop into: src/components/layout/SectionWrapper.tsx
// Requires: framer-motion (pnpm add framer-motion)

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SectionWrapperProps {
  id: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  /** Set to true for full-bleed sections that manage their own padding */
  flush?: boolean;
}

export function SectionWrapper({
  id,
  title,
  subtitle,
  children,
  className = "",
  flush = false,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={
        flush
          ? `w-full ${className}`
          : `py-20 md:py-24 max-w-[850px] mx-auto px-6 ${className}`
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {title && (
          <div className="mb-8 pb-4 border-b border-border/50">
            <h2
              className="text-3xl md:text-4xl text-primary"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-muted-foreground text-base">{subtitle}</p>
            )}
          </div>
        )}
        <div className="space-y-6">{children}</div>
      </motion.div>
    </section>
  );
}
