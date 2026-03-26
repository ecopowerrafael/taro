export function SacredGeometry() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] flex items-center justify-center z-0">
      <svg 
        width="1200" 
        height="1200" 
        viewBox="0 0 800 800" 
        xmlns="http://www.w3.org/2000/svg" 
        className="animate-[spin_120s_linear_infinite]"
      >
        <circle cx="400" cy="400" r="380" stroke="#D4AF37" strokeWidth="1" fill="none" />
        <circle cx="400" cy="400" r="280" stroke="#D4AF37" strokeWidth="1" fill="none" />
        <path d="M400 20 L729 610 L71 610 Z" stroke="#D4AF37" strokeWidth="1" fill="none" />
        <path d="M400 780 L71 190 L729 190 Z" stroke="#D4AF37" strokeWidth="1" fill="none" />
        <circle cx="400" cy="400" r="150" stroke="#D4AF37" strokeWidth="1" fill="none" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line 
            key={i}
            x1="400" 
            y1="20" 
            x2="400" 
            y2="780" 
            stroke="#D4AF37" 
            strokeWidth="0.5" 
            transform={`rotate(${i * 15} 400 400)`} 
          />
        ))}
      </svg>
    </div>
  )
}
