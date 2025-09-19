
import React from 'react';
import type { ConfigOptions } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { WandIcon } from './icons/WandIcon';

interface ControlPanelProps {
  config: ConfigOptions;
  setConfig: React.Dispatch<React.SetStateAction<ConfigOptions>>;
  onImageUpload: (file: File) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  originalImageSelected: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  setConfig,
  onImageUpload,
  onSubmit,
  isProcessing,
  originalImageSelected,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-brand-primary/30 rounded-lg p-6 space-y-6 sticky top-24">
      
      <div>
        <label htmlFor="image-upload" className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-dashed border-brand-secondary hover:border-brand-accent rounded-md cursor-pointer transition-colors duration-300 bg-brand-primary/20 hover:bg-brand-primary/40">
          <UploadIcon className="w-6 h-6 mr-3" />
          <span className="font-semibold">{originalImageSelected ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
        </label>
        <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/tiff" onChange={handleFileChange} />
        <p className="text-xs text-slate-400 mt-2 text-center">Hỗ trợ JPG, PNG, TIFF</p>
      </div>

      <OptionGroup title="Chế độ xử lý">
        <RadioOption name="mode" value="deblurOnly" label="Chỉ khử mờ" config={config} setConfig={setConfig} />
        <RadioOption name="mode" value="upscale2k" label="Nâng cấp 2K" config={config} setConfig={setConfig} />
        <RadioOption name="mode" value="upscale4k" label="Nâng cấp 4K" config={config} setConfig={setConfig} />
        <RadioOption name="mode" value="upscale8k" label="Nâng cấp 8K" config={config} setConfig={setConfig} />
      </OptionGroup>

      <OptionGroup title="Cải tiến">
        <ToggleOption label="Phục hồi khuôn mặt" checked={config.faceRestore} onChange={(checked) => setConfig(c => ({...c, faceRestore: checked}))} />
      </OptionGroup>
      
      <OptionGroup title="Giảm nhiễu">
          <SegmentedControl options={[{label: 'Thấp', value: 'low'}, {label: 'Vừa', value: 'medium'}, {label: 'Cao', value: 'high'}]}
              value={config.noiseReduction}
              onChange={(value) => setConfig(c => ({...c, noiseReduction: value as any}))}
              name="noiseReduction" />
      </OptionGroup>
      
      <OptionGroup title="Tăng chi tiết">
          <SegmentedControl options={[{label: 'Tự nhiên', value: 'natural'}, {label: 'Sắc nét', value: 'sharp'}, {label: 'Siêu nét', value: 'ultra'}]}
              value={config.detailEnhance}
              onChange={(value) => setConfig(c => ({...c, detailEnhance: value as any}))}
              name="detailEnhance" />
      </OptionGroup>

      <button
        onClick={onSubmit}
        disabled={isProcessing || !originalImageSelected}
        className="w-full bg-brand-secondary hover:bg-brand-accent disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang xử lý...
          </>
        ) : (
          <>
            <WandIcon className="w-6 h-6 mr-2" />
            Phục hồi ảnh
          </>
        )}
      </button>
    </div>
  );
};


const OptionGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
        {children}
    </div>
);

const RadioOption: React.FC<{name: string, value: string, label: string, config: ConfigOptions, setConfig: React.Dispatch<React.SetStateAction<ConfigOptions>>}> = ({name, value, label, config, setConfig}) => {
    const isChecked = config[name as keyof ConfigOptions] === value;
    return (
        <label className={`flex items-center p-3 rounded-md cursor-pointer transition-colors duration-200 ${isChecked ? 'bg-brand-secondary/30' : 'bg-slate-700/50 hover:bg-slate-700'}`}>
            <input type="radio" name={name} value={value} checked={isChecked} onChange={() => setConfig(c => ({...c, [name]: value}))} className="hidden" />
            <span className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${isChecked ? 'border-brand-accent bg-brand-accent' : 'border-slate-400'}`}>
                {isChecked && <span className="w-2 h-2 rounded-full bg-white"></span>}
            </span>
            <span className="font-medium text-slate-100">{label}</span>
        </label>
    );
}

const ToggleOption: React.FC<{label: string; checked: boolean; onChange: (checked: boolean) => void}> = ({label, checked, onChange}) => (
    <label className="flex items-center justify-between p-3 rounded-md bg-slate-700/50 cursor-pointer">
        <span className="font-medium text-slate-100">{label}</span>
        <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-brand-secondary' : 'bg-slate-600'}`}>
            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${checked ? 'transform translate-x-5' : ''}`}></span>
        </div>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
    </label>
);


interface SegmentedControlProps {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    name: string;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, name }) => {
    return (
        <div className="relative flex w-full p-1 bg-slate-700/50 rounded-lg">
            {options.map((option, index) => (
                <div key={option.value} className="flex-1 z-10">
                    <input
                        type="radio"
                        id={`${name}-${option.value}`}
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        className="sr-only"
                    />
                    <label
                        htmlFor={`${name}-${option.value}`}
                        className={`w-full block text-center text-sm font-semibold p-1.5 rounded-md cursor-pointer transition-colors duration-300 ${value === option.value ? 'text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
                    >
                        {option.label}
                    </label>
                </div>
            ))}
            <div
                className="absolute top-1 bottom-1 bg-brand-secondary rounded-md shadow-md transition-all duration-300"
                style={{
                    width: `calc((100% - 0.5rem) / ${options.length})`,
                    left: `calc(0.25rem + (100% - 0.5rem) / ${options.length} * ${options.findIndex(opt => opt.value === value)})`,
                }}
            />
        </div>
    );
};

export default ControlPanel;
