
import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import StatusBanner from './components/StatusBanner';
import ResultCard from './components/ResultCard';
import { AnalyzedImage, StatusMessageState } from './types';
import { analyzeDrugImage } from './services/geminiService';
import { Loader2, Sparkles, Trash2, Camera } from 'lucide-react';

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
      setStatusMessage({ type: 'info', message: `${newImages.length}개의 항목이 추가되었습니다.` });
    }
  }, []);

  const startAnalysis = async () => {
    const pendingImages = analyzedImages.filter(img => img.status === 'idle' || img.status === 'error');
    if (pendingImages.length === 0) return;
    
    setIsProcessing(true);
    setStatusMessage({ type: 'info', message: 'AI가 이미지를 정밀 분석 중입니다...' });

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
        setAnalyzedImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'error', error: error.message || "분석 오류" } : img
        ));
      }
    }

    setIsProcessing(false);
    const hasError = analyzedImages.some(img => img.status === 'error');
    if (!hasError) {
      setStatusMessage({ type: 'success', message: '모든 분석이 성공적으로 완료되었습니다.' });
    } else {
      setStatusMessage({ type: 'error', message: '일부 분석 중 오류가 발생했습니다. 이미지를 다시 확인해 주세요.' });
    }
  };

  const clearAll = () => {
    if (isProcessing) return;
    setAnalyzedImages([]);
    setStatusMessage(null);
  };

  const hasItems = analyzedImages.length > 0;

  return (
    <div className="min-h-screen pb-32 sm:pb-8 flex justify-center bg-[#f8fafc] overflow-x-hidden">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-b-[3rem] sm:rounded-[3rem] p-6 md:p-12 border-x border-b border-slate-100">
        <Header />

        <div className="space-y-10">
          <div className="space-y-4">
             <ImageUploader onFilesSelected={handleFilesSelected} disabled={isProcessing} />
             <StatusBanner status={statusMessage} />
          </div>

          {hasItems && (
            <div className="hidden sm:flex gap-4">
              <button
                onClick={startAnalysis}
                disabled={isProcessing}
                className={`flex-1 py-5 px-6 rounded-2xl font-black text-white shadow-2xl shadow-blue-200 transition-all duration-300 active:scale-95 ${
                  isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />분석 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Sparkles className="w-6 h-6 mr-3" />분석 시작
                  </span>
                )}
              </button>
              <button onClick={clearAll} disabled={isProcessing} className="px-8 py-5 rounded-2xl font-bold text-slate-400 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-600 transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="space-y-6">
             {hasItems && (
               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                 <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                   분석 대기 목록 
                   <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                     {analyzedImages.length} Items
                   </span>
                 </h2>
               </div>
             )}
             <div className="grid gap-8">
               {analyzedImages.map((img, index) => <ResultCard key={img.id} item={img} index={index} />)}
             </div>
          </div>
          
          {!hasItems && !statusMessage && (
            <div className="text-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-6 ring-8 ring-slate-100">
                <Camera className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-slate-500 font-black text-xl">분석할 이미지를 선택하세요</p>
              <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                처방전, 약봉투, 또는 개별 알약 사진을 업로드하면 AI가 성분을 분석합니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      {hasItems && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex gap-4 shadow-2xl z-40 safe-bottom">
          <button onClick={clearAll} disabled={isProcessing} className="p-5 rounded-2xl font-bold text-slate-400 bg-slate-100 active:bg-slate-200 transition-colors"><Trash2 className="w-6 h-6" /></button>
          <button onClick={startAnalysis} disabled={isProcessing} className={`flex-1 py-5 px-6 rounded-2xl font-black text-white shadow-2xl shadow-blue-200 active:scale-95 transition-all ${isProcessing ? 'bg-blue-400' : 'bg-blue-600'}`}>
            {isProcessing ? '분석 중...' : `분석 시작 (${analyzedImages.filter(i => i.status !== 'success').length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
