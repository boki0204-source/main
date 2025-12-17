import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import StatusBanner from './components/StatusBanner';
import ResultCard from './components/ResultCard';
import ApiKeyInput from './components/ApiKeyInput';
import { AnalyzedImage, StatusMessageState } from './types';
import { analyzeDrugImage } from './services/geminiService';
import { Loader2, Play } from 'lucide-react';

const App: React.FC = () => {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessageState | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  // Helper to read file as Base64
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
    setStatusMessage({ type: 'info', message: `${newImages.length}개의 이미지가 추가되었습니다. 분석을 시작하세요.` });
  }, []);

  const startAnalysis = async () => {
    if (!apiKey) {
      setStatusMessage({ type: 'error', message: 'API Key가 설정되지 않았습니다. 상단에서 키를 입력하고 저장해주세요.' });
      return;
    }

    const pendingImages = analyzedImages.filter(img => img.status === 'idle' || img.status === 'error');
    
    if (pendingImages.length === 0) {
      setStatusMessage({ type: 'warning', message: '분석할 대기 중인 이미지가 없습니다.' });
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage({ type: 'info', message: 'Gemini 2.5 Flash 모델로 분석을 시작합니다... (무료 등급 최적화 적용됨)' });

    // Process sequentially to avoid rate limits and provide better UX for sequential updates
    for (const image of analyzedImages) {
      if (image.status === 'success') continue; // Skip already done

      // Update status to analyzing
      setAnalyzedImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'analyzing', error: undefined } : img
      ));

      try {
        // Add a small delay (1s) to prevent hitting rate limits (429) on the Free Tier
        if (analyzedImages.indexOf(image) > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // API Call passing the user's apiKey
        const result = await analyzeDrugImage(image.base64, image.mimeType, apiKey);
        
        // Update success
        setAnalyzedImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'success', result } : img
        ));
      } catch (error: any) {
        // Update error
        setAnalyzedImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'error', error: error.message } : img
        ));
      }
    }

    setIsProcessing(false);
    setStatusMessage({ type: 'success', message: '모든 분석 작업이 완료되었습니다.' });
  };

  const clearAll = () => {
    if (isProcessing) return;
    setAnalyzedImages([]);
    setStatusMessage(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 flex justify-center font-sans text-gray-900">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-6 md:p-10 border border-gray-100">
        <Header />

        {/* API Key Input Section Restored */}
        <ApiKeyInput onApiKeyChange={setApiKey} />

        <div className="space-y-8">
          {/* Upload Section */}
          <div className="space-y-4">
             <ImageUploader onFilesSelected={handleFilesSelected} disabled={isProcessing} />
             <StatusBanner status={statusMessage} />
          </div>

          {/* Action Buttons */}
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
                    {analyzedImages.some(i => i.status === 'success') ? '나머지 항목 분석' : '분석 시작'}
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

          {/* Results List */}
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
              <p>이미지를 업로드하면 분석 결과가 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;