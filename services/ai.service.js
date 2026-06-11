import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

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
    const response = await openai.chat.completions.create({
      // Ensure this model ID is currently active on OpenRouter
      model: "mistralai/mistral-7b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      // Note: If you get errors about response_format not being supported by the model,
      // you can safely comment out the line below. Your SYSTEM_PROMPT already enforces JSON well!
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Generation Error (generateResult):", error.message);

    // FIX: Return a safe, valid JSON string so the frontend parser doesn't crash
    return JSON.stringify({
      text: "Sorry, the AI service is currently unavailable or the model is offline. Please check your OpenRouter configuration.",
    });
  }
};

export const reviewCode = async (code) => {
  if (!code) throw new Error("Code is required for review");

  const prompt = `Analyze the following code. If it has errors, fix them and provide the corrected code.give better suggestion for given code.If it is error-free,explain its functionality:\n\n\`${code}\``;

  try {
    const response = await openai.chat.completions.create({
      // FIX: Added 'openai/' prefix required by OpenRouter
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI code reviewer. Provide fixes for errors or explain the given code.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Generation Error (reviewCode):", error.message);

    // FIX: Return a friendly text error instead of crashing
    return "⚠️ Sorry, I am unable to review the code right now due to an API connection issue. Please try again later.";
  }
};
