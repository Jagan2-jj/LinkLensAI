import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface ResumeSectionEditorProps {
  initialSections: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
  };
  onSave: (sections: { summary: string; experience: string; skills: string; education: string }) => void;
  onCancel: () => void;
  file?: File | null;
  text?: string;
}

const sectionLabels = [
  { key: 'summary', label: 'Summary' },
  { key: 'experience', label: 'Experience' },
  { key: 'skills', label: 'Skills' },
  { key: 'education', label: 'Education' },
] as const;

export const ResumeSectionEditor: React.FC<ResumeSectionEditorProps> = ({ initialSections, onSave, onCancel, file, text }) => {
  const [sections, setSections] = useState(initialSections);
  const [activeSection, setActiveSection] = useState<keyof typeof initialSections>('summary');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const handleChange = (key: keyof typeof sections, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(sections);
  };

  // Helper: highlight active section in preview
  const highlightSection = (key: string, value: string) => (
    <div
      className={`transition-all duration-300 rounded-lg p-4 mb-4 relative overflow-hidden ${activeSection === key ? 'bg-gradient-to-r from-blue-100/80 via-purple-100/80 to-pink-100/80 border-2 border-blue-400 shadow-xl scale-[1.04] animate-glow' : 'bg-white/70 border border-gray-200'} animate-fade-in`}
      style={{ boxShadow: activeSection === key ? '0 0 24px #a78bfa55, 0 0 0 4px #60a5fa33' : undefined }}
    >
      <div className="font-bold text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text mb-1 text-lg tracking-wide flex items-center gap-2">
        {sectionLabels.find(s => s.key === key)?.label}
        {activeSection === key && <span className="ml-2 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
      </div>
      <div className="whitespace-pre-line text-gray-800 text-base min-h-[40px]">{value || <span className="text-gray-400 italic">(Empty)</span>}</div>
      {activeSection === key && (
        <div className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-underline-glow" />
      )}
    </div>
  );

  // PDF preview
  let fileUrl: string | null = null;
  if (file) fileUrl = URL.createObjectURL(file);

  return (
    <div className="relative min-h-[80vh] flex flex-col md:flex-row gap-8 max-w-5xl mx-auto rounded-2xl p-0 md:p-0 mt-8">
      {/* Animated background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full animate-gradient-move bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 blur-2xl opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-blue-200/10 to-purple-200/10 opacity-60" />
      </div>
      {/* Left: Editor */}
      <form onSubmit={handleSubmit} className="flex-1 z-10 space-y-6 bg-white/60 backdrop-blur-2xl rounded-2xl shadow-2xl p-6 md:p-10 border border-blue-200/40 animate-fade-in">
        <h2 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight drop-shadow">Edit Resume Sections</h2>
        {sectionLabels.map(({ key, label }) => (
          <div key={key} className="transition-all">
            <label className={`block font-semibold mb-2 capitalize cursor-pointer text-lg ${activeSection === key ? 'text-blue-700 drop-shadow-glow' : 'text-gray-700'}`}>{label}</label>
            <textarea
              className={`w-full border rounded-xl p-3 min-h-[80px] bg-white/90 focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-base font-mono ${activeSection === key ? 'border-blue-400 shadow-xl ring-2 ring-blue-300 scale-[1.02] animate-glow' : 'border-gray-300'}`}
              value={sections[key]}
              onFocus={() => setActiveSection(key)}
              onChange={e => handleChange(key, e.target.value)}
              placeholder={`Edit your ${label.toLowerCase()} here...`}
            />
          </div>
        ))}
        <div className="flex gap-4 mt-8">
          <button type="submit" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 hover:shadow-2xl">Save</button>
          <button type="button" className="px-8 py-3 bg-gray-200 text-black rounded-xl font-bold shadow hover:bg-gray-300 transition-all duration-200 transform hover:scale-105" onClick={onCancel}>Cancel</button>
        </div>
      </form>
      {/* Right: Live Preview */}
      <div className="flex-1 z-10 bg-white/60 backdrop-blur-2xl rounded-2xl shadow-2xl p-6 flex flex-col items-center min-w-[320px] max-w-md border border-blue-100 animate-fade-in">
        <h3 className="text-xl font-bold text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text mb-4 tracking-wide">Live Resume Preview</h3>
        {file && file.type === 'application/pdf' && fileUrl ? (
          <div className="w-full flex flex-col items-center">
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="w-full flex flex-col items-center"
              loading={<div className="text-blue-400">Loading PDF...</div>}
            >
              <Page pageNumber={pageNumber} width={320} />
            </Document>
            {numPages && numPages > 1 && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber === 1} className="px-2 py-1 bg-blue-100 rounded disabled:opacity-50">Prev</button>
                <span className="text-blue-700 font-semibold">Page {pageNumber} / {numPages}</span>
                <button onClick={() => setPageNumber(p => Math.min(numPages!, p + 1))} disabled={pageNumber === numPages} className="px-2 py-1 bg-blue-100 rounded disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            {sectionLabels.map(({ key }) => highlightSection(key, sections[key]))}
          </div>
        )}
      </div>
      {/* Keyframes for animation */}
      <style>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 8s ease-in-out infinite;
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px #a78bfa88);
        }
        .animate-glow {
          animation: glowPulse 1.2s infinite alternate;
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 24px #a78bfa55, 0 0 0 4px #60a5fa33; }
          100% { box-shadow: 0 0 36px #a78bfa99, 0 0 0 8px #60a5fa44; }
        }
        .animate-underline-glow {
          animation: underlineGlow 1.2s infinite alternate;
        }
        @keyframes underlineGlow {
          0% { opacity: 0.7; }
          100% { opacity: 1; filter: blur(2px); }
        }
        .animate-fade-in {
          animation: fadeInUp 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}; 