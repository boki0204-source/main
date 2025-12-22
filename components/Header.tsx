
import React from 'react';
import { Pill, Activity, ShieldCheck } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="mb-10 border-b border-slate-100 pb-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-xl shadow-blue-100 ring-4 ring-blue-50">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                MediScan <span className="text-blue-600">AI</span>
              </h1>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">Pro</span>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-blue-400" />
              Smart Drug Identification System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-100">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Service Status</p>
            <p className="text-xs font-bold text-slate-700 leading-none">AI 분석 엔진 가동 중</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50/30 border border-blue-100/50 p-4 rounded-2xl">
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>이미지 분석:</strong> 업로드된 사진 속의 알약, 캡슐을 식별하고 성분 정보를 검색합니다.
          </p>
        </div>
        <div className="bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>데이터 출처:</strong> Google Search Grounding 기술을 통해 신뢰할 수 있는 정보를 제공합니다.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
