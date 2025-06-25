import React from 'react';
import { Icon as LucideIcon } from 'lucide-react';

export interface SidebarTab {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

interface SidebarProps {
  mobileMenuOpen: boolean;
  tabs: SidebarTab[];
  activeTab: string;
  onTabSelect: (tabId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, tabs, activeTab, onTabSelect }) => (
  <aside className={`md:w-64 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
    <nav className="space-y-2">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : ''}`} />
            <span className="font-medium">{tab.name}</span>
          </button>
        );
      })}
    </nav>
  </aside>
);

export default Sidebar;
