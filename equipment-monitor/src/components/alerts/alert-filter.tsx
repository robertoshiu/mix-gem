'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AlarmSeverity } from '@/types/equipment';

interface AlertFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSeverities: AlarmSeverity[];
  onSeverityChange: (severities: AlarmSeverity[]) => void;
  className?: string;
}

const SEVERITY_OPTIONS: AlarmSeverity[] = ['CRITICAL', 'MAJOR', 'MINOR', 'INFO'];

const severityConfig = {
  CRITICAL: {
    label: 'Critical',
    bg: 'bg-red-500/20 border-red-500 text-red-400',
    activeBg: 'bg-red-500 border-red-500 text-white',
  },
  MAJOR: {
    label: 'Major',
    bg: 'bg-amber-500/20 border-amber-500 text-amber-400',
    activeBg: 'bg-amber-500 border-amber-500 text-white',
  },
  MINOR: {
    label: 'Minor',
    bg: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
    activeBg: 'bg-yellow-500 border-yellow-500 text-white',
  },
  INFO: {
    label: 'Info',
    bg: 'bg-blue-500/20 border-blue-500 text-blue-400',
    activeBg: 'bg-blue-500 border-blue-500 text-white',
  },
};

export function AlertFilter({
  searchQuery,
  onSearchChange,
  selectedSeverities,
  onSeverityChange,
  className,
}: AlertFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalSearch(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    onSearchChange('');
  }, [onSearchChange]);

  const toggleSeverity = useCallback(
    (severity: AlarmSeverity) => {
      const newSeverities = selectedSeverities.includes(severity)
        ? selectedSeverities.filter((s) => s !== severity)
        : [...selectedSeverities, severity];
      onSeverityChange(newSeverities);
    },
    [selectedSeverities, onSeverityChange]
  );

  const handleSelectAll = useCallback(() => {
    onSeverityChange([...SEVERITY_OPTIONS]);
  }, [onSeverityChange]);

  const handleClearAll = useCallback(() => {
    onSeverityChange([]);
  }, [onSeverityChange]);

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search alerts..."
          value={localSearch}
          onChange={handleSearchChange}
          className="min-h-[44px] w-full rounded-md border border-slate-700 bg-slate-900 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search alerts by message or equipment"
        />
        {localSearch && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Severity Filter Buttons */}
      <div className="flex flex-col gap-3" role="group" aria-label="Filter by severity">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Severity</span>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="min-h-[32px] px-2 text-xs text-blue-400 hover:text-blue-300"
              aria-label="Select all severities"
            >
              All
            </button>
            <button
              onClick={handleClearAll}
              className="min-h-[32px] px-2 text-xs text-slate-400 hover:text-slate-300"
              aria-label="Clear all severities"
            >
              None
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SEVERITY_OPTIONS.map((severity) => {
            const config = severityConfig[severity];
            const isSelected = selectedSeverities.includes(severity);
            return (
              <button
                key={severity}
                onClick={() => toggleSeverity(severity)}
                className={`min-h-[44px] min-w-[44px] rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected ? config.activeBg : `${config.bg} hover:opacity-80`
                }`}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${config.label} severity${isSelected ? ' (selected)' : ''}`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
