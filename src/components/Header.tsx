import React from 'react';
import { X, Menu } from 'lucide-react';

interface HeaderProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, onToggleMobileMenu }) => (
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">ASD Pietra Ligure Calcio</h1>
            <p className="text-sm text-gray-600">Registro Elettronico</p>
          </div>
        </div>
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </div>
  </header>
);

export default Header;
