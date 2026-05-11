import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type SectionWrapperProps = {
  title?: string
  id?: string
  children: ReactNode
}

export function SectionWrapper({ title, id, children }: SectionWrapperProps) {
  return (
    <div id={id}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {title ? (
          <h2 className="mb-4 border-l-4 border-blue-700 pl-3 font-heading text-xl font-semibold text-mf-ink dark:text-foreground">
            {title}
          </h2>
        ) : null}
        {children}
      </motion.div>
    </div>
  )
}
