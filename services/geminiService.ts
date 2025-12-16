import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GradingReport, GradedProblem, ImageInput, GradingPreferences, ChatMessage } from "../types";

// Schema definition for the JSON output
const gradingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isHomework: {
      type: Type.BOOLEAN,
      description: "True if the image contains recognizable homework questions (math, science, history, language, etc.), false otherwise.",
    },
    subject: {
      type: Type.STRING,
      description: "The detected subject of the homework. Use specific sub-disciplines if possible (e.g., 'Calculus', 'Chemistry', 'World History').",
    },
    subjectConfidenceScore: {
      type: Type.NUMBER,
      description: "A confidence score between 0.0 and 1.0 indicating how certain the model is about the detected subject.",
    },
    alternativeSubjects: {
      type: Type.ARRAY,
      description: "If confidence is below 0.9 or the topic overlaps multiple fields, list up to 3 other plausible subjects.",
      items: { type: Type.STRING }
    },
    summary: {
      type: Type.STRING,
      description: "A friendly, encouraging summary of the student's performance.",
    },
    totalScore: {
      type: Type.NUMBER,
      description: "The overall percentage score from 0 to 100.",
    },
    letterGrade: {
      type: Type.STRING,
      description: "The letter grade (A, B, C, D, F).",
    },
    problems: {
      type: Type.ARRAY,
      description: "List of identified problems/questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          questionText: { type: Type.STRING, description: "The question text as transcribed from the image." },
          studentResponse: { type: Type.STRING, description: "The answer the student wrote." },
          correctResponse: { type: Type.STRING, description: "The correct answer or key points required." },
          isCorrect: { type: Type.BOOLEAN, description: "True if the student's answer is substantially correct." },
          feedback: { type: Type.STRING, description: "Specific feedback for this problem, explaining errors if any." },
        },
        required: ["id", "questionText", "studentResponse", "correctResponse", "isCorrect", "feedback"],
      },
    },
    practiceQuestions: {
      type: Type.ARRAY,
      description: "3 new practice questions based on the subject and mistakes made.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          explanation: { type: Type.STRING, description: "Explanation of the answer." },
        },
        required: ["question", "answer", "explanation"],
      },
    },
  },
  required: ["isHomework", "subject", "subjectConfidenceScore", "summary", "totalScore", "letterGrade", "problems", "practiceQuestions"],
};

// Schema for Re-grading a single problem
const reGradeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questionText: { type: Type.STRING, description: "The question text (verify if changed)." },
    studentResponse: { type: Type.STRING, description: "The extracted student answer from the highlighted area." },
    correctResponse: { type: Type.STRING, description: "The correct answer." },
    isCorrect: { type: Type.BOOLEAN, description: "True if the highlighted answer is correct." },
    feedback: { type: Type.STRING, description: "Updated feedback based on the annotation." },
  },
  required: ["questionText", "studentResponse", "correctResponse", "isCorrect", "feedback"],
};

export const analyzeHomework = async (
  homeworkImages: ImageInput[], 
  subjectHint?: string,
  solutionImages?: ImageInput[],
  preferences?: GradingPreferences
): Promise<GradingReport> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let strictnessPrompt = "Be balanced in your grading.";
    if (preferences?.strictness === 'lenient') {
      strictnessPrompt = "Be LENIENT. Give partial credit generously. If the student shows the right idea but makes a small mistake, count it as correct or nearly correct.";
    } else if (preferences?.strictness === 'strict') {
      strictnessPrompt = "Be STRICT. Deduct points for minor errors. The answer must be precise to be marked correct.";
    }

    let focusPrompt = "Evaluate both logic and the final result.";
    if (preferences?.focus === 'logic') {
      focusPrompt = "Focus primarily on the STEP-BY-STEP LOGIC. If the reasoning is sound but the arithmetic is off, favor the student.";
    } else if (preferences?.focus === 'formatting') {
      focusPrompt = "Pay close attention to FORMATTING, units, and notation.";
    }

    let promptText = `You are an expert tutor powered by Gemini 3 Pro.
    Analyze the provided image(s) of handwritten or printed homework.
    ${subjectHint && subjectHint !== 'Auto-detect' ? `IMPORTANT: The user has identified this as ${subjectHint} homework. Focus your analysis on this subject context.` : ''}

    GRADING SETTINGS:
    1. ${strictnessPrompt}
    2. ${focusPrompt}

    INSTRUCTIONS:
    1. IDENTIFY THE SUBJECT:
       - If a specific subject is provided above via user input, use it and set confidence to 1.0.
       - Otherwise, detect the subject from the content. Be specific (e.g., use "Linear Algebra" rather than just "Math").
       - CALCULATE CONFIDENCE SCORE (subjectConfidenceScore):
         * 0.9 - 1.0: High certainty. The subject is clear and unambiguous.
         * 0.7 - 0.8: Moderate certainty. The content might belong to multiple sub-fields (e.g., Geometry vs Trigonometry).
         * < 0.7: Low certainty. The content is generic or mixes multiple subjects.
       - ALTERNATIVE SUBJECTS (alternativeSubjects):
         * If the confidence score is below 0.9, you MUST list up to 3 plausible alternative subjects.
         * For example, if you classify it as "Calculus", alternatives might be "Pre-Calculus" or "Analysis".
    2. TRANSCRIPTION & HANDWRITING RECOGNITION:
       - Transcribe each question found across ALL homework images.
       - PAY EXTRA ATTENTION to faint pencil marks and low-contrast text. Do not ignore light strokes.
       - Carefully decipher CURSIVE handwriting.
       - If a number or word is ambiguous, use mathematical or linguistic context to infer the most likely character.
    3. Identify the student's answer/response.
    `;

    if (solutionImages && solutionImages.length > 0) {
      promptText += `
      4. The FINAL image(s) provided are the ANSWER KEY / SOLUTION provided by the teacher. USE THEM AS THE SOURCE OF TRUTH.
      5. Compare the student's work in the Homework images against the Answer Key images.
      6. If the Answer Key does not contain a specific question found in the student work, solve it yourself.
      `;
    } else {
      promptText += `
      4. Determine the correct answer or key points yourself based on your knowledge base.
      `;
    }

    promptText += `
    7. Grade each problem. THINK STEP-BY-STEP.
    8. VERIFICATION STEP: Before finalizing the grade, explicitly double-check the student's logic and your own calculations. Ensure the "correctResponse" is accurate.
    9. Provide helpful feedback based on the Grading Settings provided.
    10. Generate 3 specific practice questions.
    11. If the image is NOT homework or is illegible, set isHomework to false.
    `;

    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

    // Add Homework Images
    homeworkImages.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    });

    // Add Solution Images if any
    if (solutionImages && solutionImages.length > 0) {
      solutionImages.forEach((img) => {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64,
          },
        });
      });
    }

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: gradingSchema,
        temperature: 0.1, // Lower temperature for more deterministic checking
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    const result = JSON.parse(text) as GradingReport;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const reGradeProblem = async (
  annotatedImageBase64: string,
  problem: GradedProblem,
  subject: string
): Promise<GradedProblem> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert tutor in ${subject} powered by Gemini 3 Pro.
    I am asking you to RE-EVALUATE a specific homework problem.
    
    CONTEXT:
    The user has manually drawn Red Marks on the attached image to Highlight the specific student answer for this question.
    
    Original Question: "${problem.questionText}"
    Previous System Evaluation: Correct? ${problem.isCorrect}.
    Previous Feedback: "${problem.feedback}"
    
    TASK:
    1. Look at the image, specifically the area highlighted in RED or where manual drawing is present.
    2. Read the handwritten answer in that specific area.
    3. CHECK YOUR WORK: Solve the problem independently and verify the student's logic.
    4. Re-grade the student's answer based on this verification.
    5. Provide updated feedback.
    
    Return a JSON object with the updated assessment.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: annotatedImageBase64,
          },
        },
        { text: prompt }
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: reGradeSchema,
      temperature: 0.1, // Lower temperature for precision
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini.");

  const result = JSON.parse(text);
  
  return {
    ...problem,
    ...result,
  };
};

export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  reportContext: GradingReport
): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct context from report
  const contextStr = `
    CURRENT HOMEWORK REPORT:
    Subject: ${reportContext.subject}
    Score: ${reportContext.totalScore}
    Summary: ${reportContext.summary}
    Problems: ${JSON.stringify(reportContext.problems.map(p => ({
      q: p.questionText,
      student_ans: p.studentResponse,
      correct: p.isCorrect,
      feedback: p.feedback
    })))}
  `;

  const prompt = `
    You are a helpful AI tutor powered by Gemini 3 Pro chatting with the user about their recently graded homework.
    Use the provided REPORT CONTEXT to answer questions specific to their mistakes.
    
    ${contextStr}

    User Question: ${newMessage}
    
    Keep answers concise, encouraging, and helpful. If explaining a math problem, use step-by-step logic.
    If the user asks for external facts or verification, use the Google Search tool to check.
  `;

  const chat = ai.chats.create({
    model: "gemini-3-pro-preview",
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
      tools: [{ googleSearch: {} }] // Enable Grounding for "checking or anything"
    }
  });

  const response = await chat.sendMessage({
    message: prompt
  });

  return response.text;
};