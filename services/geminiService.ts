import { GoogleGenAI } from "@google/genai";
import { DrugInfo } from "../types";

export const analyzeDrugImage = async (base64Data: string, mimeType: string, apiKey: string): Promise<DrugInfo[]> => {
  if (!apiKey) {
    throw new Error("API Key가 없습니다. 상단 설정에서 API Key를 입력해주세요.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Gemini 2.5 Flash instructions updated to request an ARRAY of drugs
  const systemInstruction = `
    당신은 약품 분석 전문 AI 약사입니다.
    사용자가 제공하는 이미지에 포함된 **모든** 약품을 식별하고 분석해야 합니다.
    이미지에 여러 개의 약품(알약, 포장재 등)이 있다면, 각각에 대한 정보를 개별적으로 추출하여 리스트로 반환하세요.

    [임무]
    이미지에서 각 약품에 대해 다음 정보를 추출하고 검증하세요:
    1. mainIngredientEn: 주성분명 (반드시 영문 표기, 예: Acetaminophen)
    2. productNameEn: 제품명 (영문)
    3. productNameKo: 제품명 (한글)
    4. dosage: 용량 또는 함량 (예: 500mg, 10mg/Tab)
    5. companyName: 제조사명

    [추가 작업]
    Google 검색을 사용하여 각 약품의 깨끗한 '공식 이미지 URL'을 찾아 'imageUrl' 필드에 넣으세요.

    [출력 형식]
    응답은 오직 **JSON 배열(Array)** 포맷으로만 작성되어야 합니다. 마크다운 코드 블록(\`\`\`json ... \`\`\`)을 사용하세요.
    
    예시:
    [
      {
        "mainIngredientEn": "String",
        "productNameEn": "String",
        "productNameKo": "String",
        "dosage": "String",
        "companyName": "String",
        "imageUrl": "String"
      },
      { ... }
    ]
  `;

  const userPrompt = "이 이미지에 보이는 모든 약품을 분석하여 JSON 배열 데이터로 생성해주세요.";

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
       throw new Error("API Key가 유효하지 않거나 만료되었습니다. 올바른 키를 입력했는지 확인해주세요.");
    }
    throw new Error(error.message || "이미지 분석 중 오류가 발생했습니다.");
  }
};