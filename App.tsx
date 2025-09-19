
import React, { useState, useCallback } from 'react';
import type { ConfigOptions } from './types';
import { enhanceImage } from './services/geminiService';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import ResultViewer from './components/ResultViewer';
import { Toaster, toast } from 'react-hot-toast';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  const [config, setConfig] = useState<ConfigOptions>({
    mode: 'upscale4k',
    faceRestore: true,
    noiseReduction: 'medium',
    detailEnhance: 'sharp',
  });

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setOriginalImageFile(file);
      setRestoredImage(null); // Clear previous result
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = useCallback(async () => {
    if (!originalImageFile) {
      toast.error('Vui lòng tải ảnh lên trước.');
      return;
    }

    setIsLoading(true);
    setRestoredImage(null);
    setLoadingMessage('Bắt đầu quá trình...');

    try {
      const restoredImageData = await enhanceImage(originalImageFile, config, setLoadingMessage);
      setRestoredImage(`data:image/png;base64,${restoredImageData}`);
      toast.success('Khôi phục ảnh thành công!');
    } catch (error) {
      console.error('Error restoring image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      toast.error(`Khôi phục ảnh thất bại: ${errorMessage}`);
      setRestoredImage(null);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [originalImageFile, config]);

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans">
      <Toaster position="top-center" toastOptions={{
        className: 'bg-brand-dark text-white border border-brand-primary',
        style: {
          background: '#1e293b',
          color: '#ffffff',
        },
      }}/>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <ControlPanel
              config={config}
              setConfig={setConfig}
              onImageUpload={handleImageUpload}
              onSubmit={handleSubmit}
              isProcessing={isLoading}
              originalImageSelected={!!originalImage}
            />
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <ResultViewer
              originalImage={originalImage}
              restoredImage={restoredImage}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
