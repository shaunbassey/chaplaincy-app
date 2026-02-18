import { GoogleGenAI } from "@google/genai";

const CACHE_PREFIX = "anu_ai_cache_";

function handleGeminiError(error: any): string {
  console.error("Gemini API Error:", error);
  const errorMessage = error?.message || "";
  if (errorMessage.includes("429")) return "AI service is at capacity. Please try again later.";
  if (errorMessage.includes("API_KEY_INVALID")) return "The AI configuration is incorrect (Invalid Key).";
  return "AI insights are currently unavailable.";
}

export async function getAttendanceInsights(studentName: string, attendance: number, total: number, forceRefresh = false) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "AI insights are pending configuration.";

  const percentage = (attendance / total) * 100;
  const mark = (attendance / total) * 5;
  const cacheKey = `${CACHE_PREFIX}${studentName}_${attendance}_${total}`;

  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) return parsed.text;
    }
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Student: ${studentName}. Attendance: ${attendance}/${total} (${percentage.toFixed(1)}%). Mark: ${mark.toFixed(2)}/5. Provide a 2-sentence encouraging spiritual progress summary for All Nations University.`,
    });
    
    const text = response.text || "";
    localStorage.setItem(cacheKey, JSON.stringify({ text, timestamp: Date.now() }));
    return text;
  } catch (error) {
    return handleGeminiError(error);
  }
}

export async function getAdminReport(stats: any) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Strategic analysis unavailable: API Key missing.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ANU Devotion Stats: Total Students: ${stats.studentCount}, Avg Attendance: ${stats.average}%, Top Dept: ${stats.topDept}. Write a 3-sentence summary for the Chaplaincy office.`,
    });
    return response.text;
  } catch (error) {
    return handleGeminiError(error);
  }
}