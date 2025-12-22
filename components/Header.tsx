
import React from 'react';
import { Pill, Activity, Zap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="mb-8 border-b border-gray-200 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Pill className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            MediScan <span className="text-blue-600">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100 shadow-sm">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-semibold text-gray-600">Powered by Gemini 2.5 Flash</span>
        </div>
      </div>
      <p className="text-gray-500 text-lg flex items-center gap-2 mt-4 sm:mt-2">
        <Activity className="w-4 h-4" />
        다중 약품 이미지 분석기
      </p>
      <p className="text-sm text-gray-400 mt-2">
        여러 약품 이미지를 업로드하면 AI가 개별 정보를 분석하여 알려드립니다.
      </p>
    </header>
  );
};

export default Header;