
import { GoogleGenAI } from "@google/genai";
import { DrugInfo, GroundingChunk } from "../types";

export interface AnalysisResult {
  drugs: DrugInfo[];
  groundingChunks: GroundingChunk[];
}

/**
 * 분석 서비스: 호출 시점에 환경 변수에서 최신 API 키를 가져옵니다.
 */
export const analyzeDrugImage = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  // @google/genai guidelines: 키는 반드시 process.env.API_KEY에서 가져와야 함
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API 키가 설정되지 않았습니다. 인증 절차를 완료해주세요.");
  }

  // 매 요청마다 새 인스턴스를 생성하여 최신 키 반영 보장
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    당신은 약품 분석 전문 AI 약사입니다.
    이미지에서 보이는 모든 개별 약품(알약, 캡슐, 약봉투 등)을 식별하고 분석하세요.

    [임무]
    각 약품에 대해 다음 정보를 추출하여 JSON 배열로 반환하세요:
    1. visualDescription: 약품의 외형 특징 (예: "노란색 원형 알약", "파란색 캡슐")
    2. mainIngredientEn: 주성분명 (영문)
    3. productNameEn: 제품명 (영문)
    4. productNameKo: 제품명 (한글)
    5. dosage: 함량 (예: 500mg)
    6. companyName: 제조사명
    7. imageUrl: 제품의 공식 이미지 또는 상세 정보를 확인할 수 있는 검색된 URL

    [출력 형식]
    반드시 유효한 JSON 배열 포맷으로만 응답하세요.
  `;

  try {
    // 고품질 이미지 분석을 위해 gemini-3-pro-image-preview 사용
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: "이미지의 모든 약품을 식별하여 상세 정보를 JSON 배열로 출력해주세요." },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // 검색 근거 확보를 위한 도구 활성화
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 응답 생성 실패");

    // 근거 데이터 추출
    const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];

    // JSON 파싱
    let jsonString = text.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) jsonString = jsonMatch[1];

    try {
        const parsed = JSON.parse(jsonString);
        return { 
          drugs: Array.isArray(parsed) ? parsed : [parsed], 
          groundingChunks 
        };
    } catch (e) {
        console.error("Parse error:", text);
        throw new Error("데이터 구조 해석 중 오류가 발생했습니다.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes('403') || error.message?.includes('401')) {
       throw new Error("API 키 권한이 없거나 결제 설정이 필요합니다.");
    }
    
    if (error.message?.includes('Requested entity was not found')) {
       throw new Error("Requested entity was not found");
    }

    throw new Error(error.message || "이미지 분석 중 오류가 발생했습니다.");
  }
};
