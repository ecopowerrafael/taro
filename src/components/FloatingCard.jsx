export function FloatingCard({ icon: Icon, delay = '0s', className = '' }) {
  return (
    <div 
      className={`absolute w-32 h-48 md:w-40 md:h-56 rounded-xl border border-mystic-gold/30 bg-gradient-to-b from-mystic-purple-dark/90 to-mystic-black/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 shadow-[0_0_30px_rgba(212,175,55,0.15)] animate-float z-10 ${className}`} 
      style={{ animationDelay: delay }}
    >
      <div className="absolute inset-2 border border-mystic-gold/20 rounded-lg pointer-events-none" />
      <div className="absolute top-4 left-4 text-mystic-gold/50 text-xs font-playfair">XII</div>
      <div className="absolute bottom-4 right-4 text-mystic-gold/50 text-xs font-playfair rotate-180">XII</div>
      <Icon className="text-mystic-gold w-12 h-12 drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" strokeWidth={1} />
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent" />
    </div>
  )
}
