
import { GoogleGenAI } from "@google/genai";
import { DrugInfo, GroundingChunk } from "../types";

/**
 * 분석 결과 인터페이스: 약품 정보와 검색 근거를 함께 반환합니다.
 */
export interface AnalysisResult {
  drugs: DrugInfo[];
  groundingChunks: GroundingChunk[];
}

/**
 * 분석 서비스: window.aistudio에서 관리되는 최신 API 키를 
 * 호출 시점에 process.env.API_KEY로부터 가져와 사용합니다.
 */
export const analyzeDrugImage = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  // API 키 주입 여부를 먼저 확인하여 브라우저의 불친절한 에러를 방지합니다.
  if (!process.env.API_KEY) {
    throw new Error("API 키가 아직 설정되지 않았습니다. 메인 화면의 'API 키 선택하기' 버튼을 통해 키를 먼저 설정해주세요.");
  }

  // 호출 직전에 인스턴스를 생성하여 주입된 최신 키를 반영함
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    당신은 약품 분석 전문 AI 약사입니다.
    사용자가 제공하는 이미지에는 **여러 종류의 약품**이 섞여 있을 가능성이 매우 높습니다.
    이미지 전체를 주의 깊게 스캔하여 보이는 **모든** 개별 약품(알약, 캡슐, 포장재, 약병 등)을 빠짐없이 식별하고 분석하세요.

    [임무]
    이미지에서 발견된 **각각의** 약품에 대해 다음 정보를 추출하고 리스트로 반환하세요:
    1. visualDescription: 해당 약품을 이미지에서 찾을 수 있도록 외형적 특징을 한글로 묘사 (예: "분홍색 타원형 알약", "흰색 원형 정제(C로고)", "초록색 캡슐").
    2. mainIngredientEn: 주성분명 (반드시 영문 표기, 예: Acetaminophen)
    3. productNameEn: 제품명 (영문)
    4. productNameKo: 제품명 (한글)
    5. dosage: 용량 또는 함량 (예: 500mg, 10mg/Tab)
    6. companyName: 제조사명

    [추가 작업]
    Google 검색을 사용하여 각 약품의 제품명을 기반으로 깨끗한 '공식 이미지 URL'을 찾아 'imageUrl' 필드에 넣으세요.

    [출력 형식]
    응답은 오직 **JSON 배열(Array)** 포맷으로만 작성되어야 합니다. 마크다운 코드 블록(\`\`\`json ... \`\`\`)을 사용하세요.
  `;

  const userPrompt = "이미지에 보이는 모든 약품을 식별하고, 각 약품의 외형 묘사를 포함하여 JSON 배열로 상세 분석해주세요.";

  try {
    const response = await ai.models.generateContent({
      // 복잡한 분석 및 검색 활용을 위해 gemini-3-pro-preview 모델 사용
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: userPrompt },
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
    if (!text) {
      throw new Error("AI 응답을 생성하지 못했습니다.");
    }

    // Google 검색 근거 URL 추출 (가이드라인 준수)
    const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];

    let jsonString = text.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    try {
        const parsed = JSON.parse(jsonString);
        const drugs = Array.isArray(parsed) ? parsed : [parsed];
        return { drugs, groundingChunks };
    } catch (parseError) {
        console.error("JSON Parse error:", parseError, "Text:", text);
        throw new Error("데이터 해석 중 오류가 발생했습니다.");
    }

  } catch (error: any) {
    console.error("Gemini service error:", error);
    
    // API 키 유효성 문제나 엔티티 오류 발생 시 명시적 에러 전달
    if (error.message?.includes('403') || error.message?.includes('401')) {
       throw new Error("API 키 권한 오류가 발생했습니다. 결제가 활성화된 프로젝트의 키인지 확인해주세요.");
    }
    
    if (error.message?.includes('Requested entity was not found')) {
       throw new Error("Requested entity was not found"); // App.tsx에서 캐치하여 키 재설정 유도
    }

    throw new Error(error.message || "이미지 분석 중 오류가 발생했습니다.");
  }
};
