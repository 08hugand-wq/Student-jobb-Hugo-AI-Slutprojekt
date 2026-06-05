import React from 'react';
import { 
  Briefcase, 
  Utensils, 
  Package, 
  Coffee, 
  Laptop, 
  Store, 
  Sparkles, 
  Building2, 
  Wrench, 
  Truck,
  ForkKnife
} from 'lucide-react';

interface CompanyLogoProps {
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  companyName, 
  size = 'md', 
  className = '' 
}) => {
  const normName = companyName.toLowerCase();

  // Determine design based on company name keyword mapping
  let gradient = 'from-blue-600 to-indigo-600';
  let IconComponent = Briefcase;
  let textAccent = 'text-blue-100';

  if (normName.includes('havet') || normName.includes('restaurang') || normName.includes('mat') || normName.includes('servering') || normName.includes('kök')) {
    gradient = 'from-teal-500 to-emerald-600';
    IconComponent = Utensils;
    textAccent = 'text-teal-100';
  } else if (normName.includes('logistik') || normName.includes('lager') || normName.includes('frakt') || normName.includes('transport') || normName.includes('truck') || normName.includes('ab')) {
    if (normName.includes('logistik')) {
      gradient = 'from-amber-500 to-orange-600';
      IconComponent = Package;
      textAccent = 'text-amber-100';
    } else {
      gradient = 'from-blue-500 to-sky-600';
      IconComponent = Building2;
      textAccent = 'text-blue-100';
    }
  } else if (normName.includes('café') || normName.includes('grön') || normName.includes('kaffe') || normName.includes('barista') || normName.includes('bageri')) {
    gradient = 'from-rose-500 to-pink-600';
    IconComponent = Coffee;
    textAccent = 'text-rose-100';
  } else if (normName.includes('it') || normName.includes('tech') || normName.includes('utvecklare') || normName.includes('programmerare') || normName.includes('pixel')) {
    gradient = 'from-violet-500 to-fuchsia-600';
    IconComponent = Laptop;
    textAccent = 'text-violet-100';
  } else if (normName.includes('butik') || normName.includes('handel') || normName.includes('affär') || normName.includes('shop') || normName.includes('ica') || normName.includes('coop')) {
    gradient = 'from-cyan-500 to-blue-600';
    IconComponent = Store;
    textAccent = 'text-cyan-100';
  } else if (normName.includes('bygg') || normName.includes('hantverk') || normName.includes('renovering') || normName.includes('service')) {
    gradient = 'from-emerald-500 to-teal-600';
    IconComponent = Wrench;
    textAccent = 'text-emerald-100';
  } else {
    // Fallback: Use string charCode hash to choose a deterministic handsome design
    const charsSum = companyName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const presets = [
      { grad: 'from-indigo-500 to-violet-600', icon: Building2 },
      { grad: 'from-sky-500 to-indigo-600', icon: Briefcase },
      { grad: 'from-emerald-500 to-teal-600', icon: Sparkles },
      { grad: 'from-orange-500 to-pink-600', icon: Store }
    ];
    const picked = presets[charsSum % presets.length];
    gradient = picked.grad;
    IconComponent = picked.icon;
  }

  const dimensions = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-[22px]'
  }[size];

  const iconSizes = {
    sm: 'w-4.5 h-4.5',
    md: 'w-6 h-6',
    lg: 'w-7.5 h-7.5'
  }[size];

  // Pick first 2 letters of company for subtext or fallback branding badge on hover/micro-states
  const initials = companyName.slice(0, 2).toUpperCase();

  return (
    <div className={`relative shrink-0 flex items-center justify-center bg-gradient-to-tr ${gradient} ${dimensions} shadow-sm border border-black/5 hover:scale-105 active:scale-95 transition-all duration-300 select-none ${className}`}>
      <IconComponent className={`${iconSizes} text-white`} />
      
      {/* Dynamic glossy reflection overlay */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-[inherit] pointer-events-none" />
      
      {/* Corner dynamic micro-emboss badge style effect */}
      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] pointer-events-none">
        <span className="text-[6.5px] font-black text-gray-800 tracking-tighter scale-90">{initials[0]}</span>
      </div>
    </div>
  );
};

export default CompanyLogo;
