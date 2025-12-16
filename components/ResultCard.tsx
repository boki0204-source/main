import React from 'react';
import { AnalyzedImage } from '../types';
import { Loader2, AlertCircle, CheckCircle, Search, Building2, FlaskConical, ExternalLink, Scale } from 'lucide-react';

interface ResultCardProps {
  item: AnalyzedImage;
  index: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ item, index }) => {
  const { status, result, error, previewUrl, file } = item;

  // Status colors
  const borderColor = {
    idle: 'border-gray-200',
    analyzing: 'border-blue-300 ring-4 ring-blue-50',
    success: 'border-green-300',
    error: 'border-red-200',
  }[status];

  return (
    <div className={`bg-white rounded-xl border ${borderColor} shadow-sm overflow-hidden transition-all duration-500`}>
      {/* Header Section with Image and Basic Status */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
        {/* Image Thumbnail */}
        <div className="shrink-0">
          <div className="relative w-full sm:w-32 h-48 sm:h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
            <img 
              src={previewUrl} 
              alt={file.name} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              #{index + 1}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 truncate w-full sm:w-32 text-center">
            {file.name}
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-grow min-w-0">
          {status === 'idle' && (
             <div className="h-full flex items-center text-gray-400 text-sm">
                대기 중...
             </div>
          )}

          {status === 'analyzing' && (
            <div className="h-full flex flex-col justify-center animate-pulse">
               <div className="flex items-center text-blue-600 mb-2 font-medium">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI가 분석 중입니다...
               </div>
               <div className="h-2 bg-blue-100 rounded w-3/4 mb-2"></div>
               <div className="h-2 bg-blue-100 rounded w-1/2"></div>
            </div>
          )}

          {status === 'error' && (
            <div className="h-full flex flex-col justify-center text-red-600">
               <div className="flex items-center font-bold mb-2">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  분석 실패
               </div>
               <p className="text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                 {error || "알 수 없는 오류가 발생했습니다."}
               </p>
            </div>
          )}

          {status === 'success' && result && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Product Names Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-green-100 text-green-700 p-1 rounded-full shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">
                    {result.productNameKo}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 font-medium ml-8">
                  {result.productNameEn}
                </p>
              </div>

              {/* Found Image from Search (if available) */}
              {result.imageUrl && (
                 <div className="mb-5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                       <Search className="w-4 h-4 text-blue-500" />
                       <span className="text-xs font-bold text-blue-700 uppercase">이미지 출처 (Google Search)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-100">
                      <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                      <a href={result.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline truncate hover:text-blue-800 break-all">
                         {result.imageUrl}
                      </a>
                    </div>
                 </div>
              )}
              
              {/* Info Grid - 3 columns for Dosage, Ingredient, Company */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Dosage */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-start group hover:border-emerald-200 transition-colors">
                  <div className="flex items-center mb-2 w-full">
                    <div className="bg-white p-1.5 rounded-lg border border-gray-200 mr-2 text-emerald-500 group-hover:text-emerald-600">
                      <Scale className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">용량/함량</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 break-words leading-tight w-full pl-1">{result.dosage}</p>
                </div>

                {/* Ingredient */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-start group hover:border-blue-200 transition-colors">
                  <div className="flex items-center mb-2 w-full">
                    <div className="bg-white p-1.5 rounded-lg border border-gray-200 mr-2 text-blue-500 group-hover:text-blue-600">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">주성분 (Eng)</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 break-words leading-tight w-full pl-1">{result.mainIngredientEn}</p>
                </div>

                {/* Company */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-start group hover:border-purple-200 transition-colors">
                  <div className="flex items-center mb-2 w-full">
                    <div className="bg-white p-1.5 rounded-lg border border-gray-200 mr-2 text-purple-500 group-hover:text-purple-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">업체명</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 break-words leading-tight w-full pl-1">{result.companyName}</p>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;