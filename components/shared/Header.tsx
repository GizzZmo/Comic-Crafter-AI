
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 md:p-6 bg-gray-900/80 backdrop-blur-sm border-b border-indigo-500/30 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-center">
        <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-wider">
          Comic Crafter AI
        </h1>
      </div>
    </header>
  );
};

export default Header;
