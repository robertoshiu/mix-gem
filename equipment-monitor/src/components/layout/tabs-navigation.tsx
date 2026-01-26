'use client';

import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsNavigationProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function TabsNavigation({ tabs, defaultTab, className }: TabsNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={`hidden md:block lg:hidden ${className || ''}`}>
      <div role="tablist" className="flex border-b border-slate-700" aria-label="Dashboard sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[44px] px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
          className="p-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
