
import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import StatusBanner from './components/StatusBanner';
import ResultCard from './components/ResultCard';
import { AnalyzedImage, StatusMessageState } from './types';
import { analyzeDrugImage } from './services/geminiService';
import { Loader2, Play, Key, ExternalLink, ShieldCheck } from 'lucide-react';

// window.aistudio 타입 정의를 위한 확장
// All declarations of 'aistudio' must have identical modifiers, so making it optional to match global environment.
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

  // Check for API key on mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          // If aistudio is not present, check if process.env.API_KEY is already injected
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
        // Assume success after triggering dialog to avoid race conditions
        setHasApiKey(true);
      } else {
        setStatusMessage({ 
          type: 'error', 
          message: 'API 키 선택 도구를 사용할 수 없는 환경입니다. 환경 변수를 확인해주세요.' 
        });
      }
    } catch (err) {
      console.error("Failed to open key selector:", err);
    }
  };

  const readFileAsBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const parts = result.split(',');
        if (parts.length > 1) {
          const match = parts[0].match(/:(.*?);/);
          const mimeType = match ? match[1] : file.type;
          const base64 = parts[1];
          resolve({ base64, mimeType });
        } else {
          reject(new Error("Failed to parse file data"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = useCallback(async (fileList: FileList) => {
    setStatusMessage(null);
    const newImages: AnalyzedImage[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);
      try {
        const { base64, mimeType } = await readFileAsBase64(file);
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

    if (newImages.length === 0) {
      setStatusMessage({ type: 'warning', message: '이미지 파일만 선택해주세요.' });
      return;
    }

    setAnalyzedImages((prev) => [...prev, ...newImages]);
    setStatusMessage({ type: 'info', message: `${newImages.length}개의 이미지가 추가되었습니다.` });
  }, []);

  const startAnalysis = async () => {
    const pendingImages = analyzedImages.filter(img => img.status === 'idle' || img.status === 'error');
    
    if (pendingImages.length === 0) {
      setStatusMessage({ type: 'warning', message: '분석할 대기 중인 이미지가 없습니다.' });
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage({ type: 'info', message: '이미지 분석을 시작합니다...' });

    for (const image of analyzedImages) {
      if (image.status === 'success') continue;

      setAnalyzedImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'analyzing', error: undefined } : img
      ));

      try {
        if (analyzedImages.indexOf(image) > 0) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        const { drugs, groundingChunks } = await analyzeDrugImage(image.base64, image.mimeType);
        
        setAnalyzedImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'success', result: drugs, groundingChunks } : img
        ));
      } catch (error: any) {
        console.error("Analysis failed:", error);
        
        if (error.message?.includes('Requested entity was not found')) {
            setHasApiKey(false);
            setStatusMessage({ type: 'error', message: 'API 키가 유효하지 않거나 만료되었습니다. 다시 설정해주세요.' });
            setIsProcessing(false);
            return;
        }

        setAnalyzedImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'error', error: error.message } : img
        ));
      }
    }

    setIsProcessing(false);
    setStatusMessage({ type: 'success', message: '분석이 완료되었습니다.' });
  };

  const clearAll = () => {
    if (isProcessing) return;
    setAnalyzedImages([]);
    setStatusMessage(null);
  };

  if (hasApiKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">API 키 활성화</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            제공해주신 API 키를 사용하려면 아래 버튼을 클릭하여 <br/>
            구글의 공식 보안 인증 및 키 선택 절차를 완료해야 합니다.
          </p>
          
          <button
            onClick={handleSelectKey}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mb-4"
          >
            <ShieldCheck className="w-5 h-5" />
            API 키 인증 및 적용하기
          </button>
          
          <p className="text-xs text-gray-400 mb-6">
            보안을 위해 키를 코드에 직접 입력하지 않고 인증 도구를 통해 연결합니다.
          </p>
          
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
          >
            API 키 관리 가이드 확인
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex justify-center font-sans text-gray-900">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-6 md:p-10 border border-gray-100">
        <Header />

        <div className="space-y-8">
          <div className="space-y-4">
             <ImageUploader onFilesSelected={handleFilesSelected} disabled={isProcessing} />
             <StatusBanner status={statusMessage} />
          </div>

          {analyzedImages.length > 0 && (
            <div className="flex gap-4">
              <button
                onClick={startAnalysis}
                disabled={isProcessing}
                className={`
                  flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg shadow-blue-200
                  flex items-center justify-center transition-all duration-200
                  ${isProcessing 
                    ? 'bg-blue-400 cursor-wait' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    분석 진행 중...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    {analyzedImages.some(i => i.status === 'success') ? '나머지 분석' : '분석 시작'}
                  </>
                )}
              </button>
              
              <button 
                onClick={clearAll}
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50"
              >
                초기화
              </button>
            </div>
          )}

          {analyzedImages.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-gray-100">
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-gray-800">분석 목록 ({analyzedImages.length})</h2>
               </div>
               
               <div className="grid gap-6">
                 {analyzedImages.map((img, index) => (
                   <ResultCard key={img.id} item={img} index={index} />
                 ))}
               </div>
            </div>
          )}
          
          {analyzedImages.length === 0 && !statusMessage && (
            <div className="text-center py-10 text-gray-400 border-t border-gray-100 mt-6">
              <p>약품 사진을 올리거나 카메라로 찍으면 AI가 분석을 시작합니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
