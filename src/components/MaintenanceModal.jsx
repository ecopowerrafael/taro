import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function MaintenanceModal() {
  const { t } = useTranslation();

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-gray-900 px-4"
      style={{ isolation: 'isolate' }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-20 h-20 mb-6 bg-gray-900 rounded-full flex items-center justify-center border border-gray-700 shadow-inner z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4 z-10">
          Aplicativo em Manutenção
        </h2>
        
        <p className="text-gray-300 mb-6 z-10">
          Estamos realizando melhorias no nosso sistema para oferecer uma experiência ainda melhor. Voltaremos em breve!
        </p>
        
        <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-2 overflow-hidden z-10">
          <motion.div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
