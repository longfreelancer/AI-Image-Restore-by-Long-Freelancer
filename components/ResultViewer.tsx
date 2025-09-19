
import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultViewerProps {
  originalImage: string | null;
  restoredImage: string | null;
  isLoading: boolean;
  loadingMessage: string;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ originalImage, restoredImage, isLoading, loadingMessage }) => {
  const downloadImage = () => {
    if (restoredImage) {
      const link = document.createElement('a');
      link.href = restoredImage;
      link.download = 'anh-da-phuc-hoi.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/80 backdrop-blur-sm z-10">
          <div className="w-16 h-16 border-4 border-t-transparent border-brand-accent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-slate-200">{loadingMessage}</p>
        </div>
      );
    }

    if (restoredImage && originalImage) {
      return (
        <>
          <ReactCompareSlider
            itemOne={<ReactCompareSliderImage src={originalImage} alt="Ảnh gốc" />}
            itemTwo={<ReactCompareSliderImage src={restoredImage} alt="Ảnh đã phục hồi" />}
            className="w-full h-full rounded-lg overflow-hidden shadow-2xl"
          />
          <button
            onClick={downloadImage}
            className="absolute bottom-6 right-6 bg-brand-secondary hover:bg-brand-accent text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg z-20"
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            Tải xuống
          </button>
        </>
      );
    }

    if (originalImage) {
      return <img src={originalImage} alt="Xem trước ảnh gốc" className="w-full h-full object-contain rounded-lg shadow-lg" />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <ImageIcon className="w-24 h-24 mb-4" />
        <h3 className="text-xl font-semibold">Xem trước ảnh</h3>
        <p>Tải ảnh lên để bắt đầu</p>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[75vh] bg-slate-800/50 border border-brand-primary/30 rounded-lg p-4 flex items-center justify-center overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default ResultViewer;
