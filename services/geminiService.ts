import { GoogleGenAI } from "@google/genai";
import { DrugInfo } from "../types";

/**
 * 분석 서비스: 환경 변수에서 제공되는 안정적인 API Key를 사용합니다.
 * 이 방식은 키 만료 걱정 없이 지속적인 사용이 가능합니다.
 */
export const analyzeDrugImage = async (base64Data: string, mimeType: string): Promise<DrugInfo[]> => {
  // 시스템에서 제공하는 관리형 API Key를 사용합니다.
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

  const userPrompt = "이 이미지에 보이는 모든 약품을 하나도 빠짐없이 각각 분석하여 JSON 배열 데이터로 생성해주세요. 각 약품의 외형 묘사를 상세히 포함해주세요.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // 최신 고성능 모델 사용
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
      throw new Error("AI로부터 응답을 받지 못했습니다.");
    }

    let jsonString = text.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError, "원본:", text);
        throw new Error("분석 데이터를 처리하는 중 오류가 발생했습니다.");
    }

  } catch (error: any) {
    console.error("Gemini 분석 오류:", error);
    if (error.message?.includes('403') || error.message?.includes('401')) {
       throw new Error("API 권한 문제가 발생했습니다. 시스템 관리자에게 문의하세요.");
    }
    throw new Error(error.message || "이미지 분석 중 오류가 발생했습니다.");
  }
};