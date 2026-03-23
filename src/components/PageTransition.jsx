import { motion as Motion } from 'framer-motion'

export function PageTransition({ children }) {
  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </Motion.div>
  )
}
