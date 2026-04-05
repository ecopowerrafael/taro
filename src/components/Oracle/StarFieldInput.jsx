import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';

export function StarFieldInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim().length > 5 && !isLoading) {
      onSubmit(question.trim());
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative z-20 mt-4"
    >
      <form onSubmit={handleSubmit} className="relative flex flex-col items-center w-full">
        {/* Efeito Glow atrás do textarea */}
        <div className="absolute inset-0 bg-mystic-gold/5 blur-xl rounded-2xl pointer-events-none"></div>
        
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Mentalize sua questão e escreva aqui o que deseja revelar..."
          rows={4}
          disabled={isLoading}
          className="w-full bg-[#0a0015]/80 border border-mystic-purple/50 rounded-2xl px-6 py-5 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold transition-all resize-none backdrop-blur-md text-center text-lg font-serif"
          style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}
        />

        <motion.button
          type="submit"
          disabled={question.trim().length < 5 || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 bg-transparent border-2 border-mystic-gold text-mystic-gold px-8 py-3 rounded-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.2)] uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-mystic-gold hover:text-mystic-dark transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-mystic-gold disabled:cursor-not-allowed"
        >
          {isLoading ? (
             <div className="flex items-center gap-2">
               <Sparkles className="w-5 h-5 animate-spin" />
               Consultando o Cosmos...
             </div>
          ) : (
             <div className="flex items-center gap-2">
               <Send className="w-5 h-5" />
               Revelar Resposta
             </div>
          )}
        </motion.button>
      </form>
      
      <div className="mt-4 text-center text-xs text-gray-500/80 italic font-light">
        A clareza da sua intenção guiará o caminho das estrelas.
      </div>
    </motion.div>
  );
}
