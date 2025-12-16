import { GoogleGenAI } from "@google/genai";
import { DrugAnalysisResult } from "../types";

// User provided API Key applied directly
const apiKey = "AIzaSyCIrL8x93c8K0aHPGkresn6PynIqvrE7rc";

const ai = new GoogleGenAI({ apiKey: apiKey });

export const analyzeDrugImage = async (base64Data: string, mimeType: string): Promise<DrugAnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  // Gemini 2.5 Flash works best when instructions are separated into systemInstruction
  const systemInstruction = `
    당신은 약품 분석 전문 AI 약사입니다.
    사용자가 제공하는 약품 이미지를 정밀하게 분석하고, Google 검색 도구를 활용하여 교차 검증된 정확한 정보를 제공해야 합니다.

    [임무]
    이미지에서 다음 정보를 추출하고 검증하세요:
    1. mainIngredientEn: 주성분명 (반드시 영문 표기, 예: Acetaminophen)
    2. productNameEn: 제품명 (영문)
    3. productNameKo: 제품명 (한글)
    4. dosage: 용량 또는 함량 (예: 500mg, 10mg/Tab)
    5. companyName: 제조사명

    [추가 작업]
    Google 검색을 사용하여 해당 약품의 깨끗한 '공식 이미지 URL'을 찾아 'imageUrl' 필드에 넣으세요.

    [출력 형식]
    응답은 오직 아래의 JSON 포맷으로만 작성되어야 합니다. 마크다운 코드 블록(\`\`\`json ... \`\`\`)을 사용하세요.
    
    {
      "mainIngredientEn": "String",
      "productNameEn": "String",
      "productNameKo": "String",
      "dosage": "String",
      "companyName": "String",
      "imageUrl": "String"
    }
  `;

  const userPrompt = "이 약품 이미지를 분석하여 JSON 데이터를 생성해주세요.";

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
    // Regex to capture content inside ```json ... ``` or just ``` ... ```
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    try {
        const result = JSON.parse(jsonString) as DrugAnalysisResult;
        return result;
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw Text:", text);
        throw new Error("AI 응답을 처리하는 데 실패했습니다. 다시 시도해주세요.");
    }

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error(error.message || "이미지 분석 중 오류가 발생했습니다.");
  }
};