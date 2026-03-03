import React, { useRef, useState } from 'react';
import { GlassmorphismCard } from './GlassmorphismCard';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

export const ResumeUploadSection: React.FC<{
  onFile: (file: File | null) => void;
  onText: (text: string) => void;
  isLoading: boolean;
  file: File | null;
  text: string;
}> = ({ onFile, onText, isLoading, file, text }) => {
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0]);
    }
  };

  // Preview handler
  const handlePreview = () => {
    if (file) {
      const fileType = file.type;
      const blobUrl = URL.createObjectURL(file);
      if (fileType === 'application/pdf') {
        window.open(blobUrl, '_blank');
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        window.open(blobUrl, '_blank'); // For DOCX, open in new tab (browser may download)
      }
    } else if (text) {
      setShowPreview(true);
    }
  };

  // Animated file preview
  const FilePreview = () => (
    <div className="flex items-center gap-3 p-4 bg-slate-800/80 rounded-xl shadow-inner animate-fade-in">
      <CheckCircle2 className="w-7 h-7 text-green-400 animate-pop" />
      <div>
        <div className="font-semibold text-white">{file?.name}</div>
        <div className="text-xs text-blue-200">{file ? (file.size / 1024).toFixed(1) : ''} KB</div>
      </div>
    </div>
  );

  return (
    <GlassmorphismCard className="p-8 max-w-xl w-full animate-fade-in" variant="primary" glowEffect>
      <div className="flex justify-center mb-6">
        <button
          className={`px-6 py-2 rounded-l-xl font-bold transition-all ${mode === 'file' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow' : 'bg-slate-800 text-blue-200'}`}
          onClick={() => setMode('file')}
          type="button"
        >
          <UploadCloud className="inline w-5 h-5 mr-2" />Upload File
        </button>
        <button
          className={`px-6 py-2 rounded-r-xl font-bold transition-all ${mode === 'text' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow' : 'bg-slate-800 text-blue-200'}`}
          onClick={() => setMode('text')}
          type="button"
        >
          <FileText className="inline w-5 h-5 mr-2" />Paste Text
        </button>
      </div>
      {mode === 'file' ? (
        <>
          <div
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer ${dragActive ? 'border-blue-400 bg-blue-900/20 shadow-lg animate-glow' : 'border-blue-700/40 bg-slate-900/40'}`}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            tabIndex={0}
            aria-label="Upload resume file"
            aria-dropeffect="copy"
            role="button"
          >
            <UploadCloud className="w-12 h-12 text-blue-400 mb-2 animate-float" />
            <div className="text-blue-200 font-semibold mb-1">Drag & drop your resume here</div>
            <div className="text-blue-400 text-xs mb-2">PDF, DOC, or DOCX (max 2MB)</div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <div className="text-xs text-blue-300">or click to select a file</div>
          </div>
          {file && <FilePreview />}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-blue-200 font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" /> Paste Resume Text
          </label>
          <textarea
            value={text}
            onChange={e => onText(e.target.value)}
            rows={8}
            placeholder="Paste your resume text here..."
            className="w-full px-4 py-3 bg-slate-900/60 border border-blue-400/30 rounded-xl text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-base"
            disabled={isLoading}
          />
        </div>
      )}
      <style>{`
        .animate-glow { box-shadow: 0 0 24px 4px #60a5fa55, 0 0 48px 8px #a78bfa33; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        .animate-pop { animation: pop 0.4s cubic-bezier(0.4,0,0.2,1); }
        @keyframes pop { 0%{transform:scale(0.7);} 80%{transform:scale(1.15);} 100%{transform:scale(1);} }
        .animate-fade-in { animation: fadeIn 0.7s cubic-bezier(0.4,0,0.2,1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: none; } }
      `}</style>
    </GlassmorphismCard>
  );
}; 