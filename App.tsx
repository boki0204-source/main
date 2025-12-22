
import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import StatusBanner from './components/StatusBanner';
import ResultCard from './components/ResultCard';
import { AnalyzedImage, StatusMessageState } from './types';
import { analyzeDrugImage } from './services/geminiService';
import { Loader2, Play, Key, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessageState | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        // 우선적으로 process.env.API_KEY가 있는지 확인
        if (process.env.API_KEY && process.env.API_KEY.length > 10) {
          setHasApiKey(true);
          return;
        }

        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(!!process.env.API_KEY);
        }
      } catch (err) {
        console.error("API Key check failed:", err);
        setHasApiKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // 가이드라인: 키 선택 트리거 후 즉시 성공으로 가정하고 진행
        setHasApiKey(true);
      } else {
        setStatusMessage({ 
          type: 'error', 
          message: 'API 키 선택 도구를 사용할 수 없습니다.' 
        });
      }
    } catch (err) {
      console.error("Failed to open key selector:", err);
    }
  };

  const handleFilesSelected = useCallback(async (fileList: FileList) => {
    setStatusMessage(null);
    const newImages: AnalyzedImage[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);
      try {
        const reader = new FileReader();
        const readPromise = new Promise<{base64: string, mimeType: string}>((resolve, reject) => {
          reader.onload = () => {
            const res = reader.result as string;
            const parts = res.split(',');
            resolve({ base64: parts[1], mimeType: parts[0].match(/:(.*?);/)?.[1] || file.type });
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const { base64, mimeType } = await readPromise;

        newImages.push({
          id: uuidv4(),
          file,
          previewUrl,
          base64,
          mimeType,
          status: 'idle',
        });
      } catch (err) {
        console.error("Error reading file", file.name, err);
      }
    }

    if (newImages.length > 0) {
      setAnalyzedImages((prev) => [...prev, ...newImages]);
      setStatusMessage({ type: 'info', message: `${newImages.length}개의 약품 사진이 추가되었습니다.` });
    }
  }, []);

  const startAnalysis = async () => {
    const pendingImages = analyzedImages.filter(img => img.status === 'idle' || img.status === 'error');
    if (pendingImages.length === 0) return;
    
    setIsProcessing(true);
    setStatusMessage({ type: 'info', message: 'Gemini AI가 약품을 정밀 분석하고 있습니다...' });

    for (const image of analyzedImages) {
      if (image.status === 'success') continue;

      setAnalyzedImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'analyzing', error: undefined } : img
      ));

      try {
        const { drugs, groundingChunks } = await analyzeDrugImage(image.base64, image.mimeType);
        setAnalyzedImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'success', result: drugs, groundingChunks } : img
        ));
      } catch (error: any) {
        if (error.message?.includes('Requested entity was not found')) {
            setHasApiKey(false);
            setStatusMessage({ type: 'error', message: 'API 키 인증이 만료되었습니다. 다시 설정해주세요.' });
            setIsProcessing(false);
            return;
        }
        setAnalyzedImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'error', error: error.message } : img
        ));
      }
    }

    setIsProcessing(false);
    setStatusMessage({ type: 'success', message: '모든 약품 분석이 완료되었습니다.' });
  };

  const clearAll = () => {
    setAnalyzedImages([]);
    setStatusMessage(null);
  };

  if (hasApiKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200 rotate-3">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">AI 엔진 활성화 필요</h2>
          <p className="text-slate-500 mb-10 leading-relaxed">
            안전한 분석을 위해 제공해주신 API 키를 시스템에 연결해야 합니다. <br/>
            아래 버튼을 눌러 키가 포함된 프로젝트를 선택해주세요.
          </p>
          
          <button
            onClick={handleSelectKey}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mb-6"
          >
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            API 키 인증 및 적용하기
          </button>
          
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Gemini 3 Pro 모델은 사용자 프로젝트 키 인증이 필수입니다.
            </p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center justify-center gap-1"
            >
              API 키 발급 및 관리 가이드
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex justify-center bg-slate-50">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-3xl p-6 md:p-10 border border-slate-100">
        <Header />

        <div className="space-y-8">
          <div className="space-y-4">
             <ImageUploader onFilesSelected={handleFilesSelected} disabled={isProcessing} />
             <StatusBanner status={statusMessage} />
          </div>

          {analyzedImages.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={startAnalysis}
                disabled={isProcessing}
                className={`
                  flex-1 py-4 px-6 rounded-2xl font-bold text-white shadow-lg shadow-blue-100
                  flex items-center justify-center transition-all duration-300
                  ${isProcessing 
                    ? 'bg-blue-400 cursor-wait' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    약품 분석 시작
                  </>
                )}
              </button>
              
              <button 
                onClick={clearAll}
                disabled={isProcessing}
                className="px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
              >
                초기화
              </button>
            </div>
          )}

          <div className="space-y-6">
             {analyzedImages.length > 0 && (
               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   분석 대기 목록 
                   <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{analyzedImages.length}</span>
                 </h2>
               </div>
             )}
             
             <div className="grid gap-6">
               {analyzedImages.map((img, index) => (
                 <ResultCard key={img.id} item={img} index={index} />
               ))}
             </div>
          </div>
          
          {analyzedImages.length === 0 && !statusMessage && (
            <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">약품 사진을 업로드하여 분석을 시작하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
