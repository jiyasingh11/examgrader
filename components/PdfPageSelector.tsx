import React, { useState, useEffect } from 'react';
import { Check, X, FileText, CheckCircle2 } from 'lucide-react';

interface PdfPageSelectorProps {
  isOpen: boolean;
  pages: File[];
  filename: string;
  context: 'homework' | 'solution';
  onConfirm: (selectedIndices: number[]) => void;
  onCancel: () => void;
  persona: 'teacher' | 'student';
}

export const PdfPageSelector: React.FC<PdfPageSelectorProps> = ({
  isOpen,
  pages,
  filename,
  context,
  onConfirm,
  onCancel,
  persona
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const isTeacher = persona === 'teacher';

  // Generate preview URLs when pages change
  useEffect(() => {
    if (!isOpen || pages.length === 0) return;

    // Default to selecting all pages initially
    setSelectedIndices(pages.map((_, i) => i));

    const urls = pages.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup URLs on unmount or change
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [pages, isOpen]);

  const togglePage = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index].sort((a, b) => a - b)
    );
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === pages.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(pages.map((_, i) => i));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in ${
      isTeacher 
        ? 'bg-stone-200/60 dark:bg-stone-900/80' 
        : 'bg-slate-900/60 dark:bg-slate-900/90'
    }`}>
      <div className={`rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up border ${
        isTeacher
          ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`px-8 py-6 border-b flex items-center justify-between z-10 ${
          isTeacher 
            ? 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800' 
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
        }`}>
          <div>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${
              isTeacher ? 'text-stone-800 dark:text-stone-100' : 'text-slate-900 dark:text-white'
            }`}>
              <FileText className={`w-5 h-5 ${isTeacher ? 'text-emerald-600' : 'text-indigo-500'}`} />
              Select Pages
            </h3>
            <p className={`text-sm mt-1 ${isTeacher ? 'text-stone-500 dark:text-stone-400' : 'text-slate-500 dark:text-slate-400'}`}>
              From <span className={`font-medium ${isTeacher ? 'text-stone-700 dark:text-stone-300' : 'text-slate-700 dark:text-slate-300'}`}>{filename}</span> ({context === 'homework' ? 'Homework' : 'Answer Key'})
            </p>
          </div>
          <button 
            onClick={onCancel}
            className={`p-2 rounded-full transition-colors ${
              isTeacher
                ? 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Grid */}
        <div className={`flex-1 overflow-y-auto p-8 ${
          isTeacher ? 'bg-[#fcfbf9] dark:bg-stone-950/50' : 'bg-slate-50 dark:bg-slate-950/50'
        }`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {previewUrls.map((url, index) => {
              const isSelected = selectedIndices.includes(index);
              return (
                <div 
                  key={index} 
                  onClick={() => togglePage(index)}
                  className={`relative group cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'transform scale-100' 
                      : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'
                  }`}
                >
                  <div className={`relative rounded-xl overflow-hidden border-2 aspect-[3/4] shadow-sm transition-all ${
                    isSelected 
                      ? (isTeacher 
                          ? 'border-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-900/40 shadow-lg' 
                          : 'border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/40 shadow-lg')
                      : (isTeacher
                          ? 'border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400')
                  }`}>
                    <img src={url} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                    
                    {/* Selection Overlay */}
                    <div className={`absolute inset-0 transition-colors ${
                      isSelected 
                        ? (isTeacher ? 'bg-emerald-500/10' : 'bg-indigo-500/10') 
                        : 'bg-transparent group-hover:bg-black/5'
                    }`} />
                    
                    {/* Checkbox Indicator */}
                    <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected 
                        ? (isTeacher ? 'bg-emerald-600 text-white shadow-md scale-110' : 'bg-indigo-600 text-white shadow-md scale-110')
                        : (isTeacher 
                            ? 'bg-white/80 border border-stone-300 text-transparent group-hover:border-emerald-300' 
                            : 'bg-white/80 border border-slate-300 text-transparent group-hover:border-indigo-500')
                    }`}>
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>

                    {/* Page Number */}
                    <div className={`absolute bottom-0 left-0 right-0 py-1.5 text-center backdrop-blur-sm border-t ${
                      isTeacher
                        ? 'bg-white/90 dark:bg-stone-900/90 border-stone-100 dark:border-stone-800'
                        : 'bg-white/90 dark:bg-slate-900/90 border-slate-100 dark:border-slate-800'
                    }`}>
                       <span className={`text-xs font-bold ${
                         isSelected 
                          ? (isTeacher ? 'text-emerald-700 dark:text-emerald-400' : 'text-indigo-700 dark:text-indigo-400') 
                          : (isTeacher ? 'text-stone-500 dark:text-stone-400' : 'text-slate-500 dark:text-slate-400')
                       }`}>
                         Page {index + 1}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-8 py-5 border-t flex items-center justify-between z-10 ${
          isTeacher
            ? 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
        }`}>
          <button 
            onClick={toggleSelectAll}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
              isTeacher
                ? 'text-stone-600 dark:text-stone-400 hover:text-emerald-600 hover:bg-stone-50 dark:hover:bg-stone-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {selectedIndices.length === pages.length ? 'Deselect All' : 'Select All'}
          </button>

          <div className="flex items-center gap-4">
             <div className={`text-sm font-medium ${isTeacher ? 'text-stone-500 dark:text-stone-400' : 'text-slate-500 dark:text-slate-400'}`}>
               <span className={`font-bold ${isTeacher ? 'text-stone-800 dark:text-stone-200' : 'text-slate-900 dark:text-white'}`}>{selectedIndices.length}</span> selected
             </div>
             <button
               onClick={() => onConfirm(selectedIndices)}
               disabled={selectedIndices.length === 0}
               className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                 selectedIndices.length > 0 
                   ? (isTeacher 
                       ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none hover:translate-y-[-1px]' 
                       : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none hover:translate-y-[-1px]')
                   : 'bg-stone-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
               }`}
             >
               <span>Confirm Selection</span>
               <CheckCircle2 className="w-5 h-5" />
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};