import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Google Gemini API using your new secure key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are an expert in MERN and Development. You have 10 years of experience in development. You always write modular code, break it down properly, and follow best practices. You use understandable comments in the code, create necessary files, and maintain the working of previous code. Your code is scalable, maintainable, and handles edge cases with proper error handling.

Examples: 

<example>
User: Create an express application
Response: 
{
  "text": "This is your file tree structure of the express server.",
  "fileTree": {
    "app.js": {
      "file": {
        "contents": "const express = require('express');\n\nconst app = express();\n\napp.get('/', (req, res) => {\n  res.send('Hello World!');\n});\n\napp.listen(3000, () => {\n  console.log('Server is running on port 3000');\n});"
      }
    },
    "package.json": {
      "file": {
        "contents": "{\n  \"name\": \"temp-server\",\n  \"version\": \"1.0.0\",\n  \"main\": \"index.js\",\n  \"scripts\": {\n    \"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"\n  },\n  \"keywords\": [],\n  \"author\": \"\",\n  \"license\": \"ISC\",\n  \"description\": \"\",\n  \"dependencies\": {\n    \"express\": \"^4.21.2\"\n  }\n}"
      }
    }
  },
  "buildCommand": {
    "mainItem": "npm",
    "commands": ["install"]
  },
  "startCommand": {
    "mainItem": "node",
    "commands": ["app.js"]
  }
}
</example>

<example>
User: Hello
Response: 
{
  "text": "Hello, How can I help you today?"
}
</example>

IMPORTANT: Don't use file names like routes/index.js or any nested file structure like routes/something.js. Always keep the file structure flat and avoid creating unnecessary nested directories.
`;

export const generateResult = async (prompt) => {
  try {
    // gemini-2.5-flash is extremely fast and perfect for code generation
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Force the model to return valid JSON so the frontend parser doesn't crash
    const generationConfig = {
      temperature: 0.4,
      responseMimeType: "application/json",
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    return result.response.text();
  } catch (error) {
    console.error("Gemini Generation Error (generateResult):", error.message);

    // Fallback JSON if the API fails, keeping your server alive
    return JSON.stringify({
      text: "Sorry, the AI service is currently unavailable. Please check your Gemini configuration.",
    });
  }
};

export const reviewCode = async (code) => {
  if (!code) throw new Error("Code is required for review");

  const prompt = `Analyze the following code. If it has errors, fix them and provide the corrected code. Give better suggestions for the given code. If it is error-free, explain its functionality:\n\n\`${code}\``;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "You are an AI code reviewer. Provide fixes for errors or explain the given code.",
    });

    // For code reviews, we just want standard markdown text, not JSON
    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (error) {
    console.error("Gemini Generation Error (reviewCode):", error.message);

    // Fallback text if the API fails
    return "⚠️ Sorry, I am unable to review the code right now due to an API connection issue. Please try again later.";
  }
};
