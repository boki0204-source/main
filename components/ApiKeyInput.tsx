import React, { useState, useEffect } from 'react';
import { Key, Save, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

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
    <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-700">Google Gemini API Key 설정</h3>
      </div>
      
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        앱을 사용하려면 Gemini API Key가 필요합니다. 
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center ml-1"
        >
          여기서 무료로 발급받으세요 <ExternalLink className="w-3 h-3 ml-0.5" />
        </a>
      </p>

      <div className="flex gap-2">
        <div className="relative flex-grow">
          <input
            type={isVisible ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          저장
        </button>
      </div>
    </div>
  );
};

export default ApiKeyInput;