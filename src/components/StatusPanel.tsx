import React from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusPanelProps {
  syncRate: number;
  crcSuccess: number;
  signalStrength: number;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ syncRate, crcSuccess, signalStrength }) => {
  const issues = [
    {
      id: 'signal',
      label: 'Signal Detection',
      status: signalStrength > -100 ? 'ok' : 'error',
      message: signalStrength > -100 ? 'Signal locked' : 'No signal detected'
    },
    {
      id: 'sync',
      label: 'Sync Rate',
      status: syncRate > 80 ? 'ok' : syncRate > 50 ? 'warning' : 'error',
      message: syncRate > 80 ? 'Optimal synchronization' : 'Low sync rate'
    },
    {
      id: 'crc',
      label: 'CRC Integrity',
      status: crcSuccess > 95 ? 'ok' : 'error',
      message: crcSuccess > 95 ? 'Data integrity verified' : 'High CRC failure rate'
    }
  ];

  return (
    <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4 space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wider">Diagnostic Status</h2>
      <div className="space-y-2">
        {issues.map(issue => (
          <div key={issue.id} className="flex items-center justify-between p-2 bg-black/30 rounded border border-white/5">
            <div className="flex items-center gap-3">
              {issue.status === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : issue.status === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-bold">{issue.label}</span>
                <span className="text-[9px] text-white/40 uppercase font-mono">{issue.message}</span>
              </div>
            </div>
            <div className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded",
              issue.status === 'ok' ? "bg-green-500/10 text-green-500" :
              issue.status === 'warning' ? "bg-yellow-500/10 text-yellow-500" :
              "bg-red-500/10 text-red-500"
            )}>
              {issue.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
