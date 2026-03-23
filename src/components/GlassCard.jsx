export function GlassCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`rounded-xl2 border border-mystic-gold/40 bg-mystic-purple/55 p-5 shadow-glow backdrop-blur-md ${className}`}
    >
      {(title || subtitle || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-2xl text-mystic-goldSoft">{title}</h2>}
            {subtitle && <p className="text-sm text-amber-100/70">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
