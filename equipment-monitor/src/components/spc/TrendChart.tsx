'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from '@/lib/spc-parameters';
import type { SpcParameter } from '@/lib/mes-types';

export function TrendChart() {
  const [param, setParam] = useState<SpcParameter>('cd');
  const [view, setView] = useState<'cusum' | 'ewma'>('cusum');
  const cusumResults = useMesSpcStore((s) => s.cusumResults);
  const ewmaResults = useMesSpcStore((s) => s.ewmaResults);
  const config = SPC_PARAMETERS[param];

  const cusum = cusumResults[param];
  const ewma = ewmaResults[param];

  let data: { index: number; cusumPos?: number; cusumNeg?: number; ewmaVal?: number; ucl?: number; lcl?: number }[] = [];
  let hLine: number | undefined;

  if (view === 'cusum' && cusum) {
    hLine = cusum.h;
    data = cusum.cusumPos.map((pos, i) => ({
      index: i,
      cusumPos: pos,
      cusumNeg: cusum.cusumNeg[i],
    }));
  } else if (view === 'ewma' && ewma) {
    data = ewma.ewmaValues.map((val, i) => ({
      index: i,
      ewmaVal: val,
      ucl: ewma.ucl[i],
      lcl: ewma.lcl[i],
    }));
  }

  return (
    <div data-testid="trend-chart" className="rounded border p-3" style={{ borderColor: 'var(--smartfactory-border-default)', backgroundColor: 'var(--smartfactory-surface-card)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold" style={{ color: 'var(--smartfactory-text-primary)' }}>
          Trend Analysis — {config.label}
        </div>
        <div className="flex gap-2">
          <select data-testid="trend-param-select" value={param} onChange={(e) => setParam(e.target.value as SpcParameter)}
            className="text-xs rounded px-2 py-1 border"
            style={{ backgroundColor: 'var(--smartfactory-surface-elevated)', borderColor: 'var(--smartfactory-border-default)', color: 'var(--smartfactory-text-primary)' }}>
            {SPC_PARAM_KEYS.map((k) => (<option key={k} value={k}>{k.toUpperCase()}</option>))}
          </select>
          <div className="flex rounded border overflow-hidden" style={{ borderColor: 'var(--smartfactory-border-default)' }}>
            <button data-testid="trend-view-cusum" onClick={() => setView('cusum')}
              className="text-xs px-2 py-1"
              style={{ backgroundColor: view === 'cusum' ? 'var(--smartfactory-surface-elevated)' : 'transparent', color: 'var(--smartfactory-text-primary)' }}>
              CUSUM
            </button>
            <button data-testid="trend-view-ewma" onClick={() => setView('ewma')}
              className="text-xs px-2 py-1"
              style={{ backgroundColor: view === 'ewma' ? 'var(--smartfactory-surface-elevated)' : 'transparent', color: 'var(--smartfactory-text-primary)' }}>
              EWMA
            </button>
          </div>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="text-xs py-8 text-center" style={{ color: 'var(--smartfactory-text-muted)' }}>No data yet — run the simulator to collect measurements</div>
      ) : (
        <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 200 }}>
          <LineChart data={data}>
            <XAxis dataKey="index" tick={{ fontSize: 10, fill: 'var(--smartfactory-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--smartfactory-text-muted)' }} />
            <Tooltip />
            {view === 'cusum' && hLine !== undefined && <ReferenceLine y={hLine} stroke="var(--smartfactory-status-amber)" strokeDasharray="4 4" label="h" />}
            {view === 'cusum' && <ReferenceLine y={0} stroke="var(--smartfactory-text-muted)" />}
            {view === 'cusum' && <Line type="monotone" dataKey="cusumPos" stroke="var(--smartfactory-status-green)" dot={false} name="CUSUM+" />}
            {view === 'cusum' && <Line type="monotone" dataKey="cusumNeg" stroke="var(--smartfactory-status-red)" dot={false} name="CUSUM-" />}
            {view === 'ewma' && <Line type="monotone" dataKey="ewmaVal" stroke="var(--smartfactory-accent-blue)" dot={false} name="EWMA" />}
            {view === 'ewma' && <Line type="monotone" dataKey="ucl" stroke="var(--smartfactory-status-red)" strokeDasharray="4 4" dot={false} name="UCL" />}
            {view === 'ewma' && <Line type="monotone" dataKey="lcl" stroke="var(--smartfactory-status-red)" strokeDasharray="4 4" dot={false} name="LCL" />}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
