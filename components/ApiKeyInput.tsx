import React, { useState, useEffect } from 'react';
import { Key, Save, Check, Eye, EyeOff, ExternalLink, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeyChange(savedKey);
      setIsSaved(true);
      setIsExpanded(false); // Collapse if key exists
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      onApiKeyChange(apiKey.trim());
      setIsSaved(true);
      setIsExpanded(false);
    }
  };

  const handleChange = () => {
    setIsSaved(false);
    setIsExpanded(true);
  };

  if (!isExpanded && isSaved) {
    return (
      <div className="bg-white p-3 rounded-xl border border-green-200 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-2 text-green-700">
          <div className="bg-green-100 p-1.5 rounded-full">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">API Key가 저장되어 있습니다</span>
        </div>
        <button 
          onClick={handleChange}
          className="text-xs text-gray-500 underline hover:text-blue-600 px-2"
        >
          변경하기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-700">Google Gemini API Key 설정</h3>
        </div>
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
        >
          <HelpCircle className="w-3 h-3" />
          {showGuide ? '가이드 닫기' : '무료 키 발급 방법'}
          {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      
      {showGuide && (
        <div className="mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs text-gray-600 space-y-2 animate-in fade-in zoom-in-95">
          <p className="font-semibold text-blue-700 mb-1">🔑 30초 만에 무료 키 받는 법:</p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium hover:text-blue-800">
                Google AI Studio 접속
              </a> (구글 로그인)
            </li>
            <li>왼쪽 상단 <strong>"Get API key"</strong> 클릭</li>
            <li><strong>"Create API key"</strong> 버튼 클릭</li>
            <li>생성된 <strong>"AIza..."</strong> 로 시작하는 키를 복사</li>
            <li>아래 입력창에 붙여넣고 <strong>"저장"</strong> 클릭</li>
          </ol>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-grow">
          <input
            type={isVisible ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow"
        >
          <Save className="w-4 h-4" />
          저장
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-2 ml-1">
        * 키는 브라우저에만 안전하게 저장되며 서버로 전송되지 않습니다.
      </p>
    </div>
  );
};

export default ApiKeyInput;