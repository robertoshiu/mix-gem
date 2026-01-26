'use client';

import { useState, useMemo, useCallback } from 'react';
import { AlertRow } from './alert-row';
import { AlertFilter } from './alert-filter';
import { Badge } from '@/components/ui/badge';
import type { Alarm, AlarmSeverity } from '@/types/equipment';

interface AlertsPanelProps {
  alarms: Alarm[];
  onAcknowledge: (id: string) => void;
  className?: string;
}

export function AlertsPanel({ alarms, onAcknowledge, className }: AlertsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState<AlarmSeverity[]>([
    'CRITICAL',
    'MAJOR',
    'MINOR',
    'INFO',
  ]);
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      // Search filter - matches message or equipment ID
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        alarm.message.toLowerCase().includes(searchLower) ||
        alarm.equipmentId.toLowerCase().includes(searchLower);

      // Severity filter
      const matchesSeverity = selectedSeverities.includes(alarm.severity);

      // Acknowledged filter
      const matchesAcknowledged = showAcknowledged || !alarm.acknowledged;

      return matchesSearch && matchesSeverity && matchesAcknowledged;
    });
  }, [alarms, searchQuery, selectedSeverities, showAcknowledged]);

  const groupedAlarms = useMemo(() => {
    const groups: Record<string, Alarm[]> = {};
    for (const alarm of filteredAlarms) {
      if (!groups[alarm.equipmentId]) {
        groups[alarm.equipmentId] = [];
      }
      groups[alarm.equipmentId].push(alarm);
    }
    return groups;
  }, [filteredAlarms]);

  const totalCount = filteredAlarms.length;
  const criticalCount = filteredAlarms.filter((a) => a.severity === 'CRITICAL').length;
  const acknowledgedCount = filteredAlarms.filter((a) => a.acknowledged).length;

  const handleAcknowledgeAll = useCallback(() => {
    filteredAlarms
      .filter((a) => !a.acknowledged)
      .forEach((a) => onAcknowledge(a.id));
  }, [filteredAlarms, onAcknowledge]);

  return (
    <div className={`flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Alerts</h2>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {criticalCount} Critical
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {totalCount} alert{totalCount !== 1 ? 's' : ''}
            {acknowledgedCount > 0 && ` (${acknowledgedCount} acknowledged)`}
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="p-4 border-b border-slate-700">
        <AlertFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSeverities={selectedSeverities}
          onSeverityChange={setSelectedSeverities}
        />
        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-300">Show acknowledged</span>
          </label>
          {filteredAlarms.some((a) => !a.acknowledged) && (
            <button
              onClick={handleAcknowledgeAll}
              className="min-h-[44px] px-3 text-sm text-blue-400 hover:text-blue-300"
            >
              Acknowledge all
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div
        className="flex-1 overflow-y-auto"
        role="list"
        aria-label="Alerts list"
      >
        {Object.keys(groupedAlarms).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-slate-400">No alerts match your filters</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 min-h-[44px] text-sm text-blue-400 hover:text-blue-300"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedAlarms).map(([equipmentId, equipmentAlarms]) => (
            <div key={equipmentId} role="listitem" className="border-b border-slate-700/50">
              {/* Equipment Group Header */}
              <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur px-4 py-2 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">
                    {equipmentId}
                  </span>
                  <span className="text-xs text-slate-400">
                    {equipmentAlarms.length} alert{equipmentAlarms.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {/* Alarms for this equipment */}
              <div role="list" aria-label={`Alerts for ${equipmentId}`}>
                {equipmentAlarms.map((alarm) => (
                  <AlertRow
                    key={alarm.id}
                    alarm={alarm}
                    onAcknowledge={onAcknowledge}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
