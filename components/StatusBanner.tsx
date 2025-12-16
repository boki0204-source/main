import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { StatusMessageState } from '../types';

interface StatusBannerProps {
  status: StatusMessageState | null;
}

const StatusBanner: React.FC<StatusBannerProps> = ({ status }) => {
  if (!status) return null;

  const styles = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    error: "bg-red-50 text-red-800 border-red-200",
  };

  const icons = {
    info: <Info className="w-5 h-5 mr-2" />,
    success: <CheckCircle2 className="w-5 h-5 mr-2" />,
    warning: <AlertTriangle className="w-5 h-5 mr-2" />,
    error: <AlertCircle className="w-5 h-5 mr-2" />,
  };

  return (
    <div className={`flex items-center p-4 rounded-lg border ${styles[status.type]} transition-all duration-300 animate-in fade-in slide-in-from-top-2`}>
      {icons[status.type]}
      <span className="font-medium text-sm">{status.message}</span>
    </div>
  );
};

export default StatusBanner;