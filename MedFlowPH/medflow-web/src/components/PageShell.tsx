import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="w-full min-w-0 px-0 py-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
