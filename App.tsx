import React, { useState, useCallback } from 'react';
import { AppStep, Storyboard } from './types';

import Header from './components/shared/Header';
import ApiKeyEntryStep from './components/ApiKeyEntryStep';
import IdeationStep from './components/IdeationStep';
import StoryboardStep from './components/StoryboardStep';
import GenerationStep from './components/GenerationStep';

const API_KEY_STORAGE_KEY = 'comic-crafter-api-key';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem(API_KEY_STORAGE_KEY));
  
  const [step, setStep] = useState<AppStep>(() => 
    apiKey ? AppStep.IDEATION : AppStep.API_KEY_ENTRY
  );

  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);

  const handleApiKeySubmit = useCallback((submittedKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, submittedKey);
    setApiKey(submittedKey);
    setStep(AppStep.IDEATION);
  }, []);
  
  const handleClearApiKey = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
    setStep(AppStep.API_KEY_ENTRY);
  }, []);

  const handleStoryboardGenerated = useCallback((generatedStoryboard: Storyboard) => {
    setStoryboard(generatedStoryboard);
    setStep(AppStep.STORYBOARD);
  }, []);

  const handleStoryboardConfirmed = useCallback((confirmedStoryboard: Storyboard) => {
    setStoryboard(confirmedStoryboard);
    setStep(AppStep.GENERATION);
  }, []);

  const handleGoBack = useCallback(() => {
    setStep(AppStep.IDEATION);
  }, []);

  const handleReset = useCallback(() => {
    // If user has a key, go to ideation, otherwise ask for key again.
    if (apiKey) {
      setStep(AppStep.IDEATION);
    } else {
      setStep(AppStep.API_KEY_ENTRY);
    }
    setStoryboard(null);
  }, [apiKey]);

  const renderStep = () => {
    switch (step) {
      case AppStep.API_KEY_ENTRY:
        return <ApiKeyEntryStep onApiKeySubmit={handleApiKeySubmit} />;

      case AppStep.IDEATION:
        if (!apiKey) {
            handleClearApiKey();
            return null;
        }
        return <IdeationStep apiKey={apiKey} onStoryboardGenerated={handleStoryboardGenerated} />;
      
      case AppStep.STORYBOARD:
        if (!storyboard || !apiKey) {
            handleReset();
            return null;
        }
        return (
          <StoryboardStep
            apiKey={apiKey}
            initialStoryboard={storyboard}
            onConfirmStoryboard={handleStoryboardConfirmed}
            onGoBack={handleGoBack}
          />
        );
      
      case AppStep.GENERATION:
        if (!storyboard || !apiKey) {
            handleReset();
            return null;
        }
        return <GenerationStep storyboard={storyboard} apiKey={apiKey} onReset={handleReset} />;
      
      default:
        return <ApiKeyEntryStep onApiKeySubmit={handleApiKeySubmit} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center antialiased">
      <Header />
      <main className="w-full flex-grow flex items-start justify-center py-6 md:py-10">
        {renderStep()}
      </main>
      <footer className="w-full p-4 text-center text-gray-500 text-sm">
        <p>Powered by Google Gemini. Created for demonstration purposes.</p>
        {apiKey && (
          <button 
            onClick={handleClearApiKey}
            className="mt-2 text-indigo-400 hover:text-indigo-300 underline text-xs"
          >
            Change API Key
          </button>
        )}
      </footer>
    </div>
  );
};

export default App;