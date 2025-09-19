
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-dark/50 backdrop-blur-sm border-b border-brand-primary/50 p-4 shadow-lg sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-center">
        <SparklesIcon className="w-8 h-8 text-brand-accent mr-3" />
        <h1 className="text-2xl font-bold text-white tracking-wider">
          AI Phục Hồi & Nâng Cấp Ảnh
        </h1>
      </div>
    </header>
  );
};

export default Header;
