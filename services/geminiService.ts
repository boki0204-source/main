
import { GoogleGenAI } from "@google/genai";
import { DrugInfo, GroundingChunk } from "../types";

export interface AnalysisResult {
  drugs: DrugInfo[];
  groundingChunks: GroundingChunk[];
}

export const analyzeDrugImage = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key가 설정되지 않았습니다. 환경 변수를 확인해주세요.");
  }

  // Use the high-performance Gemini 3 Pro model for medical accuracy
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
    7. imageUrl: 제품의 상세 정보를 확인할 수 있는 공식 URL (Google Search 활용)

    [출력 형식]
    반드시 유효한 JSON 배열 포맷으로만 응답하세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: "이미지의 약품들을 식별하여 JSON 배열로 상세 정보를 출력해 주세요." },
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
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 응답 생성 실패");

    const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];

    let jsonString = text.trim();
    // Remove markdown code blocks if present
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) jsonString = jsonMatch[1];

    try {
        const parsed = JSON.parse(jsonString);
        return { 
          drugs: Array.isArray(parsed) ? parsed : [parsed], 
          groundingChunks 
        };
    } catch (e) {
        throw new Error("데이터 해석 중 오류가 발생했습니다. 이미지를 다시 촬영해 주세요.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "이미지 분석 중 오류가 발생했습니다.");
  }
};
