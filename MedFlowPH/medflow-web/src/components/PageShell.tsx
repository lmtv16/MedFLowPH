import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="px-4 py-6 md:px-0"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
