import { motion } from 'framer-motion'
import { usePlatformContext } from '../context/platform-context'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const centeredVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.15 } },
}

export function NotificationCenter ({ onClose }) {
  const {
    notificationHistory,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotificationHistory,
  } = usePlatformContext()

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
      />

      {/* Modal */}
      <motion.div
        variants={centeredVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-x-3 bottom-24 z-50 flex max-h-[calc(100vh-8rem)] w-auto flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:left-1/2 md:top-1/2 md:bottom-auto md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-4 text-white md:px-6">
          <div>
            <h2 className="text-lg font-bold">Centro de Notificações</h2>
            <p className="text-sm text-purple-100">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-100 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 border-b bg-gray-50 px-4 py-3 md:px-6">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors font-medium"
            >
              Marcar tudo como lido
            </button>
          )}
          {notificationHistory.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar todo o histórico?')) {
                  clearNotificationHistory()
                }
              }}
              className="text-sm px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
            >
              Limpar histórico
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {notificationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <svg
                className="w-12 h-12 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-gray-500 font-medium">Nenhuma notificação</p>
              <p className="text-sm text-gray-400 mt-1">Você está em dia com tudo!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificationHistory.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markNotificationAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === 'call'
                          ? 'bg-green-100 text-green-600'
                          : notification.type === 'question'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {notification.type === 'call' && (
                        <span className="text-lg">📞</span>
                      )}
                      {notification.type === 'question' && (
                        <span className="text-lg">❓</span>
                      )}
                      {!notification.type && (
                        <span className="text-lg">ℹ️</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {notification.contactName && `De: ${notification.contactName} • `}
                            {new Date(notification.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
