import React, { useState } from 'react';
import ActionButton from './shared/ActionButton';

interface ApiKeyEntryStepProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyEntryStep: React.FC<ApiKeyEntryStepProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 md:p-8">
      <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 backdrop-blur-lg">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-cyan-300">Enter Your API Key</h2>
        <p className="text-center text-gray-400 mb-6">
          To use Comic Crafter AI, please provide your Google Gemini API key.
        </p>
        <p className="text-center text-xs text-gray-500 mb-6">
          Your key is stored only in your browser's local storage and is never sent anywhere except to Google's API.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">
              Gemini API Key
            </label>
            <input
              id="api-key"
              type="password"
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              placeholder="Enter your API key here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              title="Paste your Google Gemini API key here. It's used to power the AI features."
            />
          </div>

          <div className="text-center">
            <ActionButton
              type="submit"
              disabled={!apiKey.trim()}
              title="Save your API key and begin creating your comic."
            >
              Save & Start Crafting
            </ActionButton>
          </div>
        </form>
         <div className="text-center mt-4">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 underline">
                Don't have a key? Get one from Google AI Studio
            </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyEntryStep;