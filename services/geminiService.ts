
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.AIzaSyCaoJEsCSSZT4PhcVROlxkVc2xPUoxmYFQ });

const CACHE_PREFIX = "anu_ai_cache_";

/**
 * Handles common Gemini API errors and returns a user-friendly message.
 */
function handleGeminiError(error: any): string {
  console.error("Gemini API Error:", error);
  
  const errorMessage = error?.message || "";
  const status = error?.status || "";
  const code = error?.code || 0;

  // Check for 429 (Rate Limit / Quota)
  if (errorMessage.includes("429") || status === "RESOURCE_EXHAUSTED" || code === 429) {
    return "The AI service is currently at capacity (Quota Exceeded). Insights will resume shortly.";
  }
  
  // Check for 500 or UNKNOWN (RPC/Server errors)
  if (errorMessage.includes("500") || status === "UNKNOWN" || code === 500) {
    return "The AI server encountered a temporary glitch. Please try refreshing in a moment.";
  }

  // Check for safety/content issues
  if (errorMessage.includes("SAFETY")) {
    return "Insight could not be generated due to content safety filters.";
  }

  return "Unable to generate AI insights at this time. Using standard system logs instead.";
}

/**
 * Gets attendance insights with local caching to preserve quota.
 */
export async function getAttendanceInsights(studentName: string, attendance: number, total: number, forceRefresh = false) {
  const percentage = (attendance / total) * 100;
  const mark = (attendance / total) * 5;
  const cacheKey = `${CACHE_PREFIX}${studentName}_${attendance}_${total}`;

  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.text;
      }
    }
  }

  const prompt = `
    Student Name: ${studentName}
    Attendance: ${attendance} out of ${total} sessions
    Percentage: ${percentage.toFixed(2)}%
    Calculated Mark: ${mark.toFixed(2)} / 5

    Provide a professional but encouraging 2-sentence summary of the student's spiritual commitment at All Nations University.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    const resultText = response.text;
    
    if (resultText) {
      localStorage.setItem(cacheKey, JSON.stringify({
        text: resultText,
        timestamp: Date.now()
      }));
    }
    
    return resultText;
  } catch (error) {
    return handleGeminiError(error);
  }
}

export async function getAdminReport(stats: any) {
  const prompt = `
    Academic Attendance Data for ANU Devotions:
    - Total Students: ${stats.studentCount}
    - Average Attendance: ${stats.average}%
    - Top Performing Department: ${stats.topDept}

    Generate a brief 3-sentence summary report for the University Chaplaincy office regarding trends.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return handleGeminiError(error);
  }
}
