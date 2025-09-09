import React, { useState, useCallback } from 'react';
import type { Storyboard } from '../types';
import { generateIdea, generateStoryboard } from '../services/geminiService';
import ActionButton from './shared/ActionButton';
import SparklesIcon from './icons/SparklesIcon';
import Spinner from './shared/Spinner';

interface IdeationStepProps {
  apiKey: string;
  onStoryboardGenerated: (storyboard: Storyboard) => void;
}

const suggestionTypes = ["A Villain", "A Sidekick", "A Plot Twist", "A Magical Item", "An Unexpected Location"];

const artStyles: { [key: string]: string } = {
  "Classic Comic": "Vibrant colors, bold black outlines, dynamic action poses, classic American comic book art style.",
  "Manga / Anime": "Monochromatic tones with screentones for shading, expressive characters with large eyes, dynamic panel layouts, Japanese manga art style.",
  "Film Noir": "High-contrast black and white, dramatic shadows, gritty urban setting, mysterious atmosphere, film noir cinematic style.",
  "Sci-Fi Concept": "Futuristic technology, sleek metallic surfaces, neon glowing lights, detailed spacecraft and cityscapes, science fiction concept art style."
};

const IdeationStep: React.FC<IdeationStepProps> = ({ apiKey, onStoryboardGenerated }) => {
  const [storyIdea, setStoryIdea] = useState("A detective cat who solves mysteries in a city of robots.");
  const [characterDescriptions, setCharacterDescriptions] = useState("Detective Mittens: A sleek black cat wearing a tiny trench coat and fedora. Officer Bot: A friendly, chrome-plated police robot with a single blue optic sensor.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedStyleKey, setSelectedStyleKey] = useState("Classic Comic");
  const [customStyle, setCustomStyle] = useState("");

  const handleSuggestion = useCallback(async (type: string) => {
    setIsSuggesting(true);
    const suggestion = await generateIdea(apiKey, storyIdea, type);
    setStoryIdea(prev => `${prev}\n\n${suggestion}`);
    setIsSuggesting(false);
  }, [storyIdea, apiKey]);

  const handleGenerateStoryboard = async () => {
    if (!storyIdea.trim()) {
      alert("Please enter a story idea first!");
      return;
    }
    
    const finalArtStyle = selectedStyleKey === 'Custom' ? customStyle : artStyles[selectedStyleKey];
    if (!finalArtStyle || !finalArtStyle.trim()) {
      alert("Please select or define an art style.");
      return;
    }

    setIsGenerating(true);
    const storyboard = await generateStoryboard(apiKey, storyIdea, finalArtStyle, characterDescriptions);
    if (storyboard) {
      onStoryboardGenerated(storyboard);
    } else {
      alert("Failed to generate storyboard. The AI might be busy or your API key may be invalid. Please try again.");
    }
    setIsGenerating(false);
  };

  const isBusy = isGenerating || isSuggesting;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="relative bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 backdrop-blur-lg">
        
        {isGenerating && (
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-20" aria-live="assertive" role="alert">
            <Spinner message="Crafting your storyboard..." />
            <p className="text-sm text-gray-400 mt-4">The AI is warming up its pencils...</p>
          </div>
        )}
        
        <div className={isGenerating ? 'invisible' : ''}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-cyan-300">1. Craft Your Story</h2>
            <p className="text-center text-gray-400 mb-6">Start with a core idea, choose your style, and use AI to flesh it out!</p>
            
            {/* Art Style Selector */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-center text-indigo-300 mb-4">Choose an Art Style</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {Object.keys(artStyles).map(key => (
                        <button key={key} onClick={() => setSelectedStyleKey(key)} disabled={isBusy} className={`p-3 rounded-lg text-center font-semibold transition-all duration-200 border-2 ${selectedStyleKey === key ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105' : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300'}`} title={`Set the visual style of your comic to ${key}.`}>
                            {key}
                        </button>
                    ))}
                     <button onClick={() => setSelectedStyleKey('Custom')} disabled={isBusy} className={`p-3 rounded-lg text-center font-semibold transition-all duration-200 border-2 ${selectedStyleKey === 'Custom' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105' : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300'}`} title="Define your own unique art style for the comic.">
                        Custom
                    </button>
                </div>
                {selectedStyleKey === 'Custom' && (
                    <input
                        type="text"
                        className="mt-4 w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                        placeholder="Describe your custom art style, e.g., 'impressionistic watercolor style'"
                        value={customStyle}
                        onChange={(e) => setCustomStyle(e.target.value)}
                        disabled={isBusy}
                        title="Clearly describe the custom art style you want the AI to use for all images."
                    />
                )}
            </div>

            <div className="mb-6">
              <label htmlFor="story-idea" className="block text-lg font-semibold text-indigo-300 mb-2">Story Idea</label>
              <textarea
                id="story-idea"
                className="w-full h-40 p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                placeholder="e.g., A knight who is afraid of the dark..."
                value={storyIdea}
                onChange={(e) => setStoryIdea(e.target.value)}
                disabled={isBusy}
                title="Enter the main plot or concept for your comic story here."
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="character-desc" className="block text-lg font-semibold text-indigo-300 mb-2">Character Descriptions (Optional)</label>
              <p className="text-sm text-gray-400 mb-3">To improve character consistency, describe your main characters here. The AI will use this as a guide for all images.</p>
              <textarea
                  id="character-desc"
                  className="w-full h-24 p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                  placeholder="e.g., Captain Starfire: A woman with fiery red hair in a sleek silver spacesuit. Zorp: A small, green, three-eyed alien sidekick."
                  value={characterDescriptions}
                  onChange={(e) => setCharacterDescriptions(e.target.value)}
                  disabled={isBusy}
                  title="Describe your characters' appearance to help the AI keep them consistent across panels."
              />
            </div>


            <div className="my-6">
              <p className="text-center text-gray-400 mb-4 font-semibold">AI Idea Generators</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {suggestionTypes.map(type => (
                  <ActionButton
                    key={type}
                    variant="secondary"
                    onClick={() => handleSuggestion(type)}
                    disabled={isBusy || !storyIdea.trim()}
                    isLoading={isSuggesting}
                    title={`Use AI to generate and add a ${type.toLowerCase()} to your story idea.`}
                  >
                    {`Suggest ${type}`}
                  </ActionButton>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <ActionButton
                onClick={handleGenerateStoryboard}
                isLoading={isGenerating}
                disabled={isBusy || !storyIdea.trim()}
                Icon={SparklesIcon}
                title="Uses the story idea and art style to generate a title, cover prompts, and 6 comic panels."
              >
                Generate Storyboard
              </ActionButton>
            </div>
        </div>
      </div>
    </div>
  );
};

export default IdeationStep;