import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Storyboard } from '../types';
import { generateImage } from '../services/geminiService';
import ActionButton from './shared/ActionButton';
import SparklesIcon from './icons/SparklesIcon';
import Spinner from './shared/Spinner';
import RefreshIcon from './icons/RefreshIcon';

interface StoryboardStepProps {
  apiKey: string;
  initialStoryboard: Storyboard;
  onConfirmStoryboard: (storyboard: Storyboard) => void;
  onGoBack: () => void;
}

interface EditablePanelProps {
    id: string;
    label: string;
    prompt: string;
    description?: string;
    previewSrc: string;
    isLoading: boolean;
    onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onDescriptionChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onRegenerate: () => void;
}

const EditablePanel: React.FC<EditablePanelProps> = ({ id, label, prompt, description, previewSrc, isLoading, onPromptChange, onDescriptionChange, onRegenerate }) => {
    return (
        <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 flex flex-col gap-4">
            <div className="aspect-square bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                        <Spinner />
                    </div>
                )}
                {!isLoading && previewSrc && <img src={previewSrc} alt={`Preview for ${label}`} className="w-full h-full object-cover rounded-md" />}
                {!isLoading && !previewSrc && <div className="text-gray-500 text-sm p-4 text-center">Preview will appear here.</div>}
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor={id} className="block text-sm font-medium text-indigo-300">{description !== undefined ? 'Visual Prompt' : label}</label>
                    <button 
                        onClick={onRegenerate} 
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Regenerate preview for ${label}`}
                        title={`Generate a new low-quality preview image for the ${label.toLowerCase()}.`}
                    >
                        <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Regenerate
                    </button>
                </div>
                <textarea
                    id={id}
                    className="w-full h-24 p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-sm"
                    value={prompt}
                    onChange={onPromptChange}
                    disabled={isLoading}
                    placeholder={description !== undefined ? "A visual description for the AI artist..." : "Prompt for the cover art..."}
                    title="This text is the prompt used to generate the panel's image. Edit it to change the visual."

                />
            </div>

            {description !== undefined && onDescriptionChange && (
                <div>
                    <label htmlFor={`${id}-desc`} className="block text-sm font-medium text-indigo-300 mb-2">Narration / Dialogue</label>
                    <textarea
                        id={`${id}-desc`}
                        className="w-full h-20 p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-sm"
                        value={description}
                        onChange={onDescriptionChange}
                        disabled={isLoading}
                        placeholder="Text to appear in the panel..."
                        title="This text will be displayed as narration or dialogue in the final comic."
                    />
                </div>
            )}
        </div>
    );
};

const StoryboardStep: React.FC<StoryboardStepProps> = ({ apiKey, initialStoryboard, onConfirmStoryboard, onGoBack }) => {
  const [storyboard, setStoryboard] = useState<Storyboard>(initialStoryboard);
  const [previews, setPreviews] = useState<Record<string, string>>({}); // id -> base64
  const [loadingPreviews, setLoadingPreviews] = useState<Record<string, boolean>>({});

  const allPrompts = useMemo(() => {
    const promptsMap: { [id: string]: { prompt: string; label: string } } = {
      'front-cover': { prompt: storyboard.frontCoverPrompt, label: 'Front Cover' },
      'back-cover': { prompt: storyboard.backCoverPrompt, label: 'Back Cover' },
    };
    storyboard.panels.forEach((p, i) => {
      promptsMap[`panel-${i}`] = { prompt: p.prompt, label: `Panel ${i + 1}` };
    });
    return promptsMap;
  }, [storyboard]);

  const generatePreview = useCallback(async (id: string, prompt: string) => {
    if (!prompt.trim()) return;
    setLoadingPreviews(prev => ({ ...prev, [id]: true }));
    const base64Image = await generateImage(apiKey, `A detailed comic book panel preview sketch in black and white line art with basic shading, depicting: ${prompt}`);
    if (base64Image) {
      setPreviews(prev => ({ ...prev, [id]: base64Image }));
    } else {
      console.error(`Failed to generate preview for ${id}`);
    }
    setLoadingPreviews(prev => ({ ...prev, [id]: false }));
  }, [apiKey]);

  useEffect(() => {
    const idsToGenerate = Object.keys(allPrompts);
    let promiseChain = Promise.resolve();
    idsToGenerate.forEach(id => {
      promiseChain = promiseChain.then(() => {
        if (!previews[id]) {
          return generatePreview(id, allPrompts[id].prompt)
        }
        return Promise.resolve();
      });
    });
  }, []); // Intentionally empty to run only on mount

  const handlePromptChange = (index: number, value: string) => {
    const newPanels = [...storyboard.panels];
    newPanels[index] = { ...newPanels[index], prompt: value };
    setStoryboard({ ...storyboard, panels: newPanels });
  };
  
  const handleDescriptionChange = (index: number, value: string) => {
    const newPanels = [...storyboard.panels];
    newPanels[index] = { ...newPanels[index], description: value };
    setStoryboard({ ...storyboard, panels: newPanels });
  };

  const handleCoverPromptChange = (cover: 'front' | 'back', value: string) => {
    if (cover === 'front') {
      setStoryboard({ ...storyboard, frontCoverPrompt: value });
    } else {
      setStoryboard({ ...storyboard, backCoverPrompt: value });
    }
  };
  
  const handleRegenerate = (id: string) => {
    const prompt = allPrompts[id]?.prompt;
    if(prompt) {
        generatePreview(id, prompt);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 backdrop-blur-lg">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-cyan-300">2. Review Your Storyboard</h2>
        <p className="text-center text-gray-400 mb-6">Tweak the prompts and regenerate previews to perfect your vision.</p>
        
        <h3 className="text-xl font-bold text-center text-white mb-4">{storyboard.title}</h3>
        
        {storyboard.characterDescriptions && (
            <div className="my-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h4 className="text-base font-semibold text-indigo-300 mb-2">Character Consistency Guide (For Your Reference)</h4>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{storyboard.characterDescriptions}</p>
            </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <EditablePanel
                id="front-cover"
                label="Front Cover Prompt"
                prompt={storyboard.frontCoverPrompt}
                previewSrc={previews['front-cover'] ? `data:image/jpeg;base64,${previews['front-cover']}` : ''}
                isLoading={!!loadingPreviews['front-cover']}
                onPromptChange={(e) => handleCoverPromptChange('front', e.target.value)}
                onRegenerate={() => handleRegenerate('front-cover')}
            />
            <EditablePanel
                id="back-cover"
                label="Back Cover Prompt"
                prompt={storyboard.backCoverPrompt}
                previewSrc={previews['back-cover'] ? `data:image/jpeg;base64,${previews['back-cover']}` : ''}
                isLoading={!!loadingPreviews['back-cover']}
                onPromptChange={(e) => handleCoverPromptChange('back', e.target.value)}
                onRegenerate={() => handleRegenerate('back-cover')}
            />
          </div>
          
          <h4 className="text-lg font-semibold text-center text-indigo-300 pt-6 border-t border-gray-700">Comic Panels</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storyboard.panels.map((panel, index) => {
                const panelId = `panel-${index}`;
                return (
                     <EditablePanel
                        key={panelId}
                        id={panelId}
                        label={`Panel ${index + 1}`}
                        prompt={panel.prompt}
                        description={panel.description}
                        previewSrc={previews[panelId] ? `data:image/jpeg;base64,${previews[panelId]}` : ''}
                        isLoading={!!loadingPreviews[panelId]}
                        onPromptChange={(e) => handlePromptChange(index, e.target.value)}
                        onDescriptionChange={(e) => handleDescriptionChange(index, e.target.value)}
                        onRegenerate={() => handleRegenerate(panelId)}
                    />
                )
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <ActionButton onClick={onGoBack} variant="secondary" title="Return to the previous step to change your story idea or art style.">
            Go Back & Revise
          </ActionButton>
          <ActionButton onClick={() => onConfirmStoryboard(storyboard)} Icon={SparklesIcon} title="Lock in the storyboard and proceed to generate the final, high-quality comic images.">
            Generate My Comic!
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default StoryboardStep;