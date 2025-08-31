export enum AppStep {
  API_KEY_ENTRY,
  IDEATION,
  STORYBOARD,
  GENERATION,
}

export interface Panel {
  prompt: string;
  description: string;
}

export interface Storyboard {
  title: string;
  frontCoverPrompt: string;
  panels: Panel[];
  backCoverPrompt: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  base64: string;
  label: string;
}