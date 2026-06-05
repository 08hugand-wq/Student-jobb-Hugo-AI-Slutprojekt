import React from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';
import { audioService } from '../services/audioService';

interface AppLogoProps {
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ 
  className = '', 
  onClick, 
  interactive = true 
}) => {
  const handleClick = () => {
    if (interactive) {
      audioService.playClick();
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`flex items-center gap-3 select-none ${interactive ? 'cursor-pointer active:scale-98 transition-all duration-200' : ''} ${className}`}
    >
      {/* High-fidelity Brandmark Icon */}
      <div className="relative">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400 flex items-center justify-center shadow-md shadow-blue-100/50 hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
          <GraduationCap className="w-6 h-6 text-white" />
          
          {/* Small shiny badge overlapping in corner */}
          <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-400 rounded-lg flex items-center justify-center border border-white shadow-sm animate-bounce [animation-duration:3s]">
            <Sparkles className="w-2.5 h-2.5 text-amber-950" />
          </div>
          
          {/* Gloss overlay accent */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-2xl pointer-events-none" />
        </div>
      </div>

      {/* Modern Wordmark */}
      <div className="flex flex-col">
        <h1 className="text-lg font-black tracking-tight leading-none text-blue-600 flex items-center gap-0.5">
          STUDENT
          <span className="text-gray-900 font-extrabold">JOBB</span>
        </h1>
        <span className="text-[8.5px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 leading-none">
          Extraknäck på sekunden
        </span>
      </div>
    </div>
  );
};

export default AppLogo;
