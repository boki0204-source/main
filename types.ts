
export interface DrugInfo {
  mainIngredientEn: string; // 주성분명(영문)
  productNameEn: string;    // 제품명(영문)
  productNameKo: string;    // 제품명(한글)
  dosage: string;           // 용량
  companyName: string;      // 업체명
  imageUrl?: string;        // 이미지 출처 URL
  visualDescription?: string; // 약품의 외형적 특징 (예: 분홍색 타원형 알약)
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalyzedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  status: 'idle' | 'analyzing' | 'success' | 'error';
  result?: DrugInfo[]; // 단일 객체에서 배열로 변경
  groundingChunks?: GroundingChunk[]; // Google 검색 근거 데이터 추가
  error?: string;
}

export interface StatusMessageState {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
