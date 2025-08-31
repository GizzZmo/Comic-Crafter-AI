import { GoogleGenAI, Type } from "@google/genai";
import type { Storyboard } from '../types';

const getAiClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API_KEY is not set. Please provide a valid API key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateIdea = async (apiKey:string, baseIdea: string, ideaType: string): Promise<string> => {
  const prompt = `You are a creative assistant for a comic book writer.
Based on this central idea: "${baseIdea}"

Suggest a compelling ${ideaType} for the story. Be creative and concise, providing one single suggestion.`;

  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 1,
        maxOutputTokens: 150,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating idea:", error);
    return "An error occurred while brainstorming. Please try again.";
  }
};

export const generateStoryboard = async (apiKey: string, storyIdea: string, artStyle: string): Promise<Storyboard | null> => {
  const prompt = `You are a master comic book writer. Your task is to create a full storyboard for a 6-panel comic strip based on the user's story.
You must also generate a title, a prompt for the front cover art, and a prompt for the back cover art.

- The **Title** should be catchy and relevant.
- The **Front Cover** prompt should be an epic scene introducing the main character(s) and theme.
- For each of the 6 **Panels**, you must provide:
    - A **visual prompt** that describes the action for the artist.
    - A **description** containing the narration or dialogue text that will appear on the panel. This can be an empty string if there is no text.
- The **Back Cover** prompt should be a fun, cool, or intriguing closing image.
- For all visual prompts (covers and panels), ensure they describe a scene in a "${artStyle}".

The user's story is:
"${storyIdea}"`;

  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The catchy title of the comic book." },
            frontCoverPrompt: { type: Type.STRING, description: `A detailed visual prompt for the front cover art, in the requested art style.` },
            panels: {
              type: Type.ARRAY,
              description: "An array of exactly 6 panel objects, each containing a visual prompt and a description (narration/dialogue).",
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING, description: "A detailed visual prompt for the panel artwork." },
                  description: { type: Type.STRING, description: "The narration or dialogue text for the panel. Can be empty." }
                },
                required: ["prompt", "description"]
              }
            },
            backCoverPrompt: { type: Type.STRING, description: `A detailed visual prompt for the back cover art, in the requested art style.` }
          },
          required: ["title", "frontCoverPrompt", "panels", "backCoverPrompt"]
        }
      }
    });
    
    const jsonText = response.text.trim();
    const parsedStoryboard: Storyboard = JSON.parse(jsonText);

    if(parsedStoryboard.panels.length !== 6) {
        console.warn("AI did not return exactly 6 panels. Adjusting...");
        // Simple fix: truncate or pad if necessary
        while(parsedStoryboard.panels.length < 6) parsedStoryboard.panels.push({ prompt: "A blank panel.", description: "" });
        if(parsedStoryboard.panels.length > 6) parsedStoryboard.panels = parsedStoryboard.panels.slice(0, 6);
    }

    return parsedStoryboard;

  } catch (error) {
    console.error("Error generating storyboard:", error);
    return null;
  }
};

export const generateImage = async (apiKey: string, prompt: string): Promise<string | null> => {
  try {
    const ai = getAiClient(apiKey);
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1', // Square panels are classic
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};