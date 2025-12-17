import { GoogleGenAI } from "@google/genai";
import { DrugInfo } from "../types";

// 제공된 API Key를 상수로 정의합니다.
const API_KEY = "AIzaSyAlt7Q4z11HURLU2aLTkv0cX76sbPrMv60";

export const analyzeDrugImage = async (base64Data: string, mimeType: string): Promise<DrugInfo[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Gemini 2.5 Flash instructions updated to request an ARRAY of drugs with visual descriptions
  const systemInstruction = `
    당신은 약품 분석 전문 AI 약사입니다.
    사용자가 제공하는 이미지에는 **여러 종류의 약품**이 섞여 있을 가능성이 매우 높습니다.
    이미지 전체를 주의 깊게 스캔하여 보이는 **모든** 개별 약품(알약, 캡슐, 포장재, 약병 등)을 빠짐없이 식별하고 분석하세요.

    [임무]
    이미지에서 발견된 **각각의** 약품에 대해 다음 정보를 추출하고 리스트로 반환하세요:
    1. visualDescription: 해당 약품을 이미지에서 찾을 수 있도록 외형적 특징을 한글로 묘사 (예: "분홍색 타원형 알약", "흰색 원형 정제(C로고)", "초록색 캡슐"). **이 필드는 사용자가 약을 구분하는 데 매우 중요합니다.**
    2. mainIngredientEn: 주성분명 (반드시 영문 표기, 예: Acetaminophen)
    3. productNameEn: 제품명 (영문, 식별 불가능하면 추정치)
    4. productNameKo: 제품명 (한글, 식별 불가능하면 성분명으로 대체)
    5. dosage: 용량 또는 함량 (예: 500mg, 10mg/Tab)
    6. companyName: 제조사명

    [추가 작업]
    Google 검색을 사용하여 각 약품의 제품명을 기반으로 깨끗한 '공식 이미지 URL'을 찾아 'imageUrl' 필드에 넣으세요.

    [출력 형식]
    응답은 오직 **JSON 배열(Array)** 포맷으로만 작성되어야 합니다. 마크다운 코드 블록(\`\`\`json ... \`\`\`)을 사용하세요.
    
    예시:
    [
      {
        "visualDescription": "주황색 원형 알약",
        "mainIngredientEn": "Ibuprofen",
        "productNameEn": "Advil",
        "productNameKo": "애드빌 정",
        "dosage": "200mg",
        "companyName": "Pfizer",
        "imageUrl": "https://..."
      },
      { ... }
    ]
  `;

  const userPrompt = "이 이미지에 보이는 모든 약품을 하나도 빠짐없이 각각 분석하여 JSON 배열 데이터로 생성해주세요. 각 약품의 외형 묘사를 상세히 포함해주세요.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
      throw new Error("No response text received from Gemini.");
    }

    // Extract JSON from potential Markdown code blocks
    let jsonString = text.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    try {
        const parsed = JSON.parse(jsonString);
        // Ensure result is always an array
        const result: DrugInfo[] = Array.isArray(parsed) ? parsed : [parsed];
        return result;
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw Text:", text);
        throw new Error("AI 응답을 처리하는 데 실패했습니다. 다시 시도해주세요.");
    }

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Handle 403 specifically to give a better error message
    if (error.message?.includes('403') || error.toString().includes('403')) {
       throw new Error("API Key 권한 오류입니다. 키가 만료되었거나 허용되지 않은 요청입니다.");
    }
    throw new Error(error.message || "이미지 분석 중 오류가 발생했습니다.");
  }
};