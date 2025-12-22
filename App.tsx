
import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import StatusBanner from './components/StatusBanner';
import ResultCard from './components/ResultCard';
import { AnalyzedImage, StatusMessageState } from './types';
import { analyzeDrugImage } from './services/geminiService';
import { Loader2, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessageState | null>(null);

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
            resolve({ 
              base64: parts[1], 
              mimeType: parts[0].match(/:(.*?);/)?.[1] || file.type 
            });
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
        console.error("Analysis Error:", error);
        let errorMessage = error.message || "이미지 분석 중 오류가 발생했습니다.";
        
        if (error.message?.includes('403') || error.message?.includes('API key')) {
          errorMessage = "API 키가 유효하지 않거나 권한이 없습니다. 환경 설정을 확인해주세요.";
        }

        setAnalyzedImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'error', error: errorMessage } : img
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
                    분석 진행 중...
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
                   분석 리스트 
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
              <p className="text-slate-400 font-medium">약품 사진을 업로드하거나 촬영하여 분석을 시작하세요.</p>
              <p className="text-[10px] text-slate-300 mt-4">AI 분석 결과는 참고용이며, 정확한 복약 지도는 의사나 약사에게 문의하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
