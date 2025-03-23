import * as ai from "../services/ai.service.js";

export const getResult = async (req, res) => {
  try {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).send({ message: "Prompt is required" });
    }

    const result = await ai.generateResult(prompt);
    res.send(result);
  } catch (error) {
    console.error("Error generating result:", error);
    res.status(500).send({ message: error.message });
  }
};

export const reviewCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "No code provided for review" });
    }

    // Call AI service for review
    const feedback = await ai.reviewCode(code); // ✅ FIXED

    res.json({ feedback });
  } catch (error) {
    console.error("Error reviewing code:", error);
    res.status(500).json({ error: "Error processing code review" });
  }
};
