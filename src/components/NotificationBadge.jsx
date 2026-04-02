import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePlatformContext } from '../context/platform-context'
import { NotificationCenter } from './NotificationCenter'

export function NotificationBadge ({ className = '' }) {
  const { unreadCount } = usePlatformContext()
  const [showCenter, setShowCenter] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowCenter(!showCenter)}
        className={`relative inline-flex items-center justify-center rounded-lg p-2 transition-all active:scale-95 ${className}`}
        aria-label={`Notificações (${unreadCount} não lidas)`}
        title={`Notificações (${unreadCount} não lidas)`}
      >
        <svg
          className="h-6 w-6 text-current"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge com contador */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing ring quando há notificações */}
        {unreadCount > 0 && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-red-500"
            animate={{ scale: [1, 1.1], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </button>

      {/* Notification Center Modal */}
      <AnimatePresence>
        {showCenter && (
          <NotificationCenter onClose={() => setShowCenter(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
