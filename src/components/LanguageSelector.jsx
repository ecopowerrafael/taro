import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const languages = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
  ]

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-mystic-gold/30 bg-black/20 px-3 py-1.5 text-xs font-medium text-mystic-gold transition hover:border-mystic-gold/60 hover:bg-mystic-gold/10"
      >
        <Globe size={14} />
        {i18n.language?.toUpperCase().slice(0, 2) || 'PT'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 flex w-16 flex-col overflow-hidden rounded-xl border border-mystic-gold/40 bg-mystic-purple-dark/95 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`px-4 py-2 text-center text-xs font-medium transition ${
                  i18n.language?.startsWith(lang.code)
                    ? 'bg-mystic-gold/20 text-mystic-goldSoft'
                    : 'text-amber-100/70 hover:bg-black/40 hover:text-amber-50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
