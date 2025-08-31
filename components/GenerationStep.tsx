
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Storyboard, GeneratedImage } from '../types';
import { generateImage } from '../services/geminiService';
import Spinner from './shared/Spinner';
import ActionButton from './shared/ActionButton';
import DownloadIcon from './icons/DownloadIcon';
import RefreshIcon from './icons/RefreshIcon';

interface GenerationStepProps {
  storyboard: Storyboard;
  apiKey: string;
  onReset: () => void;
}

const GenerationStep: React.FC<GenerationStepProps> = ({ storyboard, apiKey, onReset }) => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [status, setStatus] = useState("Warming up the AI artists...");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [pdfScale, setPdfScale] = useState(2); // State for PDF/Image quality


  const allPrompts = useMemo(() => [
    { id: 'front-cover', prompt: storyboard.frontCoverPrompt, label: 'Front Cover' },
    ...storyboard.panels.map((p, i) => ({ id: `panel-${i + 1}`, prompt: p.prompt, label: `Panel ${i + 1}` })),
    { id: 'back-cover', prompt: storyboard.backCoverPrompt, label: 'Back Cover' },
  ], [storyboard]);

  const generateAllImages = useCallback(async () => {
    setIsGenerating(true);
    const images: GeneratedImage[] = [];

    for (let i = 0; i < allPrompts.length; i++) {
      const item = allPrompts[i];
      setStatus(`Generating ${item.label}... (${i + 1}/${allPrompts.length})`);
      const base64Image = await generateImage(apiKey, item.prompt);
      if (base64Image) {
        images.push({ id: item.id, prompt: item.prompt, base64: base64Image, label: item.label });
        setGeneratedImages([...images]);
      } else {
        images.push({ id: item.id, prompt: item.prompt, base64: '', label: `${item.label} (Failed)` });
        setGeneratedImages([...images]);
        console.error(`Failed to generate image for: ${item.label}`);
      }
    }

    setStatus("Your comic is ready!");
    setIsGenerating(false);
  }, [allPrompts, apiKey]);
  
  const handleRegenerate = useCallback(async (imageToRegen: GeneratedImage) => {
    if (regeneratingId || isGenerating) return;

    setRegeneratingId(imageToRegen.id);
    const newBase64 = await generateImage(apiKey, imageToRegen.prompt);

    if (newBase64) {
      setGeneratedImages(prev => prev.map(img => 
        img.id === imageToRegen.id ? { ...img, base64: newBase64 } : img
      ));
    } else {
      alert(`Failed to regenerate ${imageToRegen.label}. Please try again.`);
    }

    setRegeneratingId(null);
  }, [apiKey, isGenerating, regeneratingId]);

  useEffect(() => {
    generateAllImages();
  }, [generateAllImages]);

  const handleDownloadComic = async () => {
      const qualityLabel = pdfScale > 2 ? 'ultra high quality' : 'high quality';
      if (!window.confirm(`This will generate a ${qualityLabel} PDF of your comic. This process can take some time, especially on higher resolutions. Continue?`)) {
        return;
      }

      const comicElement = document.getElementById('comic-for-download');
      if (!comicElement) {
          console.error("Comic container not found for download.");
          alert("Could not find comic content to download. Please try again.");
          return;
      }

      setIsSaving(true);
      try {
          const canvas = await html2canvas(comicElement, {
              scale: pdfScale, // Use selected scale for quality
              useCORS: true,
              backgroundColor: '#ffffff',
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          const pdf = new jsPDF({
              orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
              unit: 'px',
              format: [imgWidth, imgHeight]
          });

          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          const safeTitle = storyboard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'my-comic';
          pdf.save(`comic-crafter-${safeTitle}.pdf`);

      } catch (error) {
          console.error("Error generating PDF:", error);
          alert("Sorry, there was an error creating your comic PDF. Please try again.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleDownloadImage = async () => {
    const qualityLabel = pdfScale > 2 ? 'ultra high resolution' : 'high resolution';
    if (!window.confirm(`This will generate a ${qualityLabel} PNG image of your comic. Continue?`)) {
        return;
    }
    
    const comicElement = document.getElementById('comic-for-download');
    if (!comicElement) {
        console.error("Comic container not found for download.");
        alert("Could not find comic content to download. Please try again.");
        return;
    }

    setIsSavingImage(true);
    try {
        const canvas = await html2canvas(comicElement, {
            scale: pdfScale,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const imageURL = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        const safeTitle = storyboard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'my-comic';
        link.download = `comic-crafter-${safeTitle}.png`;
        link.href = imageURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error generating image:", error);
        alert("Sorry, there was an error creating your comic image. Please try again.");
    } finally {
        setIsSavingImage(false);
    }
  };

  const isGenerationInProgress = isGenerating || regeneratingId !== null;
  const isSavingFile = isSaving || isSavingImage;
  const allImagesDone = !isGenerating && generatedImages.length === allPrompts.length;

  if (isGenerating && generatedImages.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-white">
        <Spinner message={status} />
      </div>
    );
  }

  const findImage = (id: string) => generatedImages.find(img => img.id === id);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      {allImagesDone && <PrintableComic storyboard={storyboard} images={generatedImages} />}

      <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 backdrop-blur-lg">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-cyan-300">3. Your Comic Book!</h2>
        <p className="text-center text-gray-400 mb-6">{isGenerationInProgress ? status : storyboard.title}</p>

        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImagePanel 
                    image={findImage('front-cover')} 
                    label="Front Cover"
                    isLoading={!findImage('front-cover')}
                    isRegenerating={regeneratingId === 'front-cover'}
                    onRegenerate={handleRegenerate}
                    isGenerationInProgress={isGenerationInProgress}
                />
                <ImagePanel 
                    image={findImage('back-cover')}
                    label="Back Cover"
                    isLoading={!findImage('back-cover')}
                    isRegenerating={regeneratingId === 'back-cover'}
                    onRegenerate={handleRegenerate}
                    isGenerationInProgress={isGenerationInProgress}
                />
            </div>

            <div className="bg-gray-900/60 p-4 md:p-6 rounded-lg border-2 border-dashed border-gray-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storyboard.panels.map((panel, index) => {
                        const panelId = `panel-${index + 1}`;
                        const label = `Panel ${index + 1}`;
                        return (
                           <ImagePanel 
                                key={panelId} 
                                image={findImage(panelId)} 
                                label={label}
                                isLoading={!findImage(panelId)}
                                isRegenerating={regeneratingId === panelId}
                                onRegenerate={handleRegenerate}
                                isGenerationInProgress={isGenerationInProgress}
                                description={panel.description}
                           />
                        )
                    })}
                </div>
            </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <ActionButton onClick={onReset} variant="secondary" disabled={isGenerationInProgress || isSavingFile} title="Start over from the beginning to create a new comic.">
            Create Another Comic
          </ActionButton>
          {allImagesDone && (
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2" role="radiogroup" aria-labelledby="download-quality-label">
                    <span id="download-quality-label" className="text-sm font-medium text-gray-300 mr-2 whitespace-nowrap">Download Quality:</span>
                    <button 
                        role="radio"
                        onClick={() => setPdfScale(2)} 
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${pdfScale === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                        aria-checked={pdfScale === 2}
                        title="Generate a high-quality file. Good balance between file size and image clarity."
                    >
                        High
                    </button>
                    <button 
                        role="radio"
                        onClick={() => setPdfScale(4)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${pdfScale === 4 ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                        aria-checked={pdfScale === 4}
                        title="Generate an ultra-high-quality file. Larger file size but maximum image detail."
                    >
                        Ultra
                    </button>
                </div>
                <div className="flex items-center gap-4">
                  <ActionButton
                      onClick={handleDownloadComic}
                      Icon={DownloadIcon}
                      disabled={isGenerationInProgress || isSavingFile}
                      isLoading={isSaving}
                      loadingText="Creating PDF..."
                      title="Compile all images into a single, high-quality comic book PDF file."
                  >
                      Download PDF
                  </ActionButton>
                  <ActionButton
                      onClick={handleDownloadImage}
                      Icon={DownloadIcon}
                      disabled={isGenerationInProgress || isSavingFile}
                      isLoading={isSavingImage}
                      loadingText="Creating Image..."
                      title="Compile all images into a single, high-quality comic strip PNG file."
                  >
                      Download Image
                  </ActionButton>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ImagePanelProps {
    image?: GeneratedImage;
    label: string;
    isLoading: boolean;
    isRegenerating: boolean;
    onRegenerate: (image: GeneratedImage) => void;
    isGenerationInProgress: boolean;
    description?: string;
}

const ImagePanel: React.FC<ImagePanelProps> = ({ image, label, isLoading, isRegenerating, onRegenerate, isGenerationInProgress, description }) => {
    const downloadImage = () => {
        if (!image || !image.base64) return;
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${image.base64}`;
        link.download = `${image.label.replace(/\s+/g, '_').toLowerCase()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRegenerateClick = () => {
        if (image) {
            onRegenerate(image);
        }
    };

    return (
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-700 group relative aspect-square flex items-center justify-center">
            {isLoading && !isRegenerating && (
                <div className="p-4 text-center flex flex-col items-center justify-center w-full">
                    <h3 className="font-bold text-lg text-indigo-300 mb-2">{label}</h3>
                    {description && (
                        <p className="text-sm italic text-gray-400 bg-gray-800 p-3 rounded-md border border-gray-700 max-h-24 overflow-y-auto w-full">
                            {description}
                        </p>
                    )}
                    <div className="mt-4">
                        <Spinner />
                    </div>
                </div>
            )}
            {isRegenerating && (
                <div className="absolute inset-0 z-20 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
                    <Spinner message="Regenerating..." />
                </div>
            )}
            {image && image.base64 && (
                <img src={`data:image/jpeg;base64,${image.base64}`} alt={image.prompt} className="w-full h-full object-cover"/>
            )}
            {image && !image.base64 && !isRegenerating && (
                 <div className="text-center text-red-400 p-4">
                    <p className="font-bold">{label}</p>
                    <p>Generation Failed</p>
                </div>
            )}
            {image && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <p className="text-sm text-gray-300 text-center">{image.prompt}</p>
                    <div className="flex items-center gap-4">
                        {image.base64 && (
                            <button onClick={downloadImage} disabled={isGenerationInProgress} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed" title={`Download this single image (${label}) as a JPG file.`}>
                                <DownloadIcon className="w-5 h-5" />
                                Download
                            </button>
                        )}
                         <button onClick={handleRegenerateClick} disabled={isGenerationInProgress} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed" title={`Generate a new high-quality version of this image using its original prompt.`}>
                            <RefreshIcon className="w-5 h-5" />
                            Regenerate
                        </button>
                    </div>
                </div>
            )}
            <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs font-bold p-2 rounded-tr-lg z-10">
                {isRegenerating ? '...' : label}
            </div>
        </div>
    )
};

// Component to lay out the full comic for PDF generation. It will be hidden from view.
interface PrintableComicProps {
  storyboard: Storyboard;
  images: GeneratedImage[];
}

const PrintableComic: React.FC<PrintableComicProps> = ({ storyboard, images }) => {
  const findImageSrc = (id: string) => {
    const img = images.find(i => i.id === id);
    return img?.base64 ? `data:image/jpeg;base64,${img.base64}` : undefined;
  };

  const frontCoverSrc = findImageSrc('front-cover');
  const backCoverSrc = findImageSrc('back-cover');
  const panelSrcs = storyboard.panels.map((_, i) => findImageSrc(`panel-${i + 1}`));

  return (
    <div
      id="comic-for-download"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '800px',
        padding: '40px',
        backgroundColor: 'white',
        color: 'black',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '40px', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px' }}>
        {storyboard.title}
      </h1>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #ccc', paddingBottom: '5px' }}>Front Cover</h2>
        {frontCoverSrc ? (
          <img src={frontCoverSrc} style={{ width: '100%', border: '2px solid black' }} alt="Front Cover"/>
        ) : <div style={{height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc'}}>Image not available</div>}
      </div>

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #ccc', paddingBottom: '5px' }}>Comic Panels</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {panelSrcs.map((src, index) => (
            <div key={index}>
                <p style={{textAlign: 'center', fontWeight: 'bold', marginBottom: '5px'}}>Panel {index + 1}</p>
                {src ? (
                    <img src={src} style={{ width: '100%', border: '2px solid black' }} alt={`Panel ${index + 1}`}/>
                ) : <div style={{aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc'}}>Image not available</div>}
                {storyboard.panels[index].description && (
                  <p style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                  }}>
                      {storyboard.panels[index].description}
                  </p>
                )}
            </div>
          ))}
        </div>
      </div>

       <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #ccc', paddingBottom: '5px' }}>Back Cover</h2>
        {backCoverSrc ? (
          <img src={backCoverSrc} style={{ width: '100%', border: '2px solid black' }} alt="Back Cover"/>
        ) : <div style={{height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc'}}>Image not available</div>}
      </div>
    </div>
  );
};


export default GenerationStep;