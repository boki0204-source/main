import React from 'react';
import { AnalyzedImage } from '../types';
import { Loader2, AlertCircle, CheckCircle, Search, Building2, FlaskConical, ExternalLink, Scale, Pill } from 'lucide-react';

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
      <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        {/* Image Thumbnail */}
        <div className="shrink-0 flex flex-col items-center md:items-start">
          <div className="relative w-full sm:w-48 md:w-32 h-48 sm:h-48 md:h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 shadow-inner">
            <img 
              src={previewUrl} 
              alt={file.name} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              #{index + 1}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 truncate w-32 text-center">
            {file.name}
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-grow min-w-0 w-full">
          {status === 'idle' && (
             <div className="h-full flex items-center justify-center md:justify-start text-gray-400 text-sm">
                대기 중...
             </div>
          )}

          {status === 'analyzing' && (
            <div className="h-full flex flex-col justify-center items-center md:items-start animate-pulse py-4">
               <div className="flex items-center text-blue-600 mb-2 font-medium">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI가 이미지 속 약품들을 분석 중입니다...
               </div>
               <div className="h-2 bg-blue-100 rounded w-full max-w-md mb-2"></div>
               <div className="h-2 bg-blue-100 rounded w-2/3 max-w-sm"></div>
            </div>
          )}

          {status === 'error' && (
            <div className="h-full flex flex-col justify-center text-red-600 py-2">
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
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
                 <h4 className="text-sm font-semibold text-gray-500 flex items-center">
                   <Pill className="w-4 h-4 mr-1.5" />
                   식별된 약품: <span className="text-blue-600 ml-1">{result.length}개</span>
                 </h4>
              </div>

              <div className="space-y-8">
                {result.map((drug, drugIndex) => (
                  <div key={drugIndex} className="relative pl-0 md:pl-4 border-l-0 md:border-l-2 md:border-gray-100">
                    
                    {/* Drug Header */}
                    <div className="mb-4">
                      <div className="flex items-start gap-3 mb-1">
                        <span className="shrink-0 bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm mt-0.5">
                          {drugIndex + 1}
                        </span>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                            {drug.productNameKo}
                          </h3>
                          <p className="text-sm text-gray-500 font-medium">
                            {drug.productNameEn}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Found Image from Search (if available) */}
                    {drug.imageUrl && (
                       <div className="mb-4 ml-9 p-3 bg-blue-50/30 rounded-xl border border-blue-100/50">
                          <div className="flex items-center gap-2 mb-2">
                             <Search className="w-3.5 h-3.5 text-blue-500" />
                             <span className="text-[10px] font-bold text-blue-700 uppercase">공식 이미지 출처</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-50">
                            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                            <a href={drug.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline truncate hover:text-blue-800 break-all">
                               {drug.imageUrl}
                            </a>
                          </div>
                       </div>
                    )}
                    
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-0 md:ml-9">
                      
                      {/* Dosage */}
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex flex-col items-start group hover:border-emerald-200 transition-colors">
                        <div className="flex items-center mb-1.5 w-full">
                          <div className="bg-white p-1 rounded border border-gray-200 mr-2 text-emerald-500">
                            <Scale className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">용량/함량</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 break-words leading-tight w-full pl-0.5">{drug.dosage}</p>
                      </div>

                      {/* Ingredient */}
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex flex-col items-start group hover:border-blue-200 transition-colors">
                        <div className="flex items-center mb-1.5 w-full">
                          <div className="bg-white p-1 rounded border border-gray-200 mr-2 text-blue-500">
                            <FlaskConical className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">주성분 (Eng)</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 break-words leading-tight w-full pl-0.5">{drug.mainIngredientEn}</p>
                      </div>

                      {/* Company */}
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex flex-col items-start group hover:border-purple-200 transition-colors">
                        <div className="flex items-center mb-1.5 w-full">
                          <div className="bg-white p-1 rounded border border-gray-200 mr-2 text-purple-500">
                            <Building2 className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">업체명</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 break-words leading-tight w-full pl-0.5">{drug.companyName}</p>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;