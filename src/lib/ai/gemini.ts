import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GENAI_API_KEY;

if (!apiKey) {
  throw new Error("GENAI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function summarizeWithGemini(content: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a code summarizer. Given the following repository data, create a concise technical summary that includes:
1. Repository structure (key directories and their purpose)
2. Main technologies and dependencies
3. Key files and their functionality
4. Notable implementation patterns or architecture decisions
5.make sure the summarized text is as short and consise as possible the info you give is only needed to explain about the code to potential clients and recruiters of the developer, doesnt need to be overly detailed

Provide a structured, technical summary that would help answer questions about this codebase. Here is the content:

${content}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (e) {
    console.error("Error summarizing with Gemini:", e);
    return "Error: Could not summarize the content."
  }
}
