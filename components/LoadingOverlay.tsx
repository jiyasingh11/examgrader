import React, { useEffect, useState } from 'react';
import { Loader2, BrainCircuit, Sparkles, CheckCircle2, ScanLine, Eraser, FileSearch } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  isProcessingImage?: boolean;
  persona: 'teacher' | 'student';
}

const processingSteps = [
  { icon: ScanLine, text: "Deskewing & Aligning..." },
  { icon: Eraser, text: "Removing Noise..." },
  { icon: FileSearch, text: "Enhancing Contrast..." },
];

const analysisSteps = [
  { icon: BrainCircuit, text: "Reading handwriting..." },
  { icon: Sparkles, text: "Analyzing logic..." },
  { icon: CheckCircle2, text: "Finalizing grade..." },
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, isProcessingImage, persona }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = isProcessingImage ? processingSteps : analysisSteps;

  const isTeacher = persona === 'teacher';

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev)), isProcessingImage ? 800 : 1500);
      return () => clearInterval(interval);
    } else setCurrentStep(0);
  }, [isVisible, isProcessingImage]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300 pt-16 ${
      isTeacher 
        ? 'bg-[#fcfbf9]/95 dark:bg-stone-950/95' 
        : 'bg-white/95 dark:bg-slate-950/95'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-[2rem] shadow-2xl text-center relative overflow-hidden border ${
        isTeacher
          ? 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 shadow-stone-200 dark:shadow-black/50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-indigo-100 dark:shadow-black/50'
      }`}>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r animate-loading-bar ${
          isTeacher 
            ? 'from-emerald-300 via-emerald-500 to-emerald-300' 
            : 'from-indigo-400 via-purple-500 to-pink-500'
        }`}></div>
        
        <div className="relative mb-8 flex justify-center mt-4">
          <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
            isTeacher ? 'bg-emerald-500/20' : 'bg-indigo-500/20'
          }`}></div>
          <div className={`p-4 rounded-full relative shadow-md ${
            isTeacher ? 'bg-white dark:bg-stone-800' : 'bg-white dark:bg-slate-800'
          }`}>
            <Loader2 className={`w-12 h-12 animate-spin ${
              isTeacher ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-500'
            }`} />
          </div>
        </div>
        
        <h3 className={`text-2xl font-bold mb-2 tracking-tight ${
          isTeacher ? 'text-stone-800 dark:text-stone-100 font-serif' : 'text-slate-900 dark:text-white'
        }`}>
          {isProcessingImage ? "Enhancing Image" : "Grading in Progress"}
        </h3>
        <p className={`mb-8 font-medium ${
          isTeacher ? 'text-stone-500 dark:text-stone-400' : 'text-slate-500 dark:text-slate-400'
        }`}>
          {isProcessingImage ? "Preparing your homework for AI analysis..." : "Please wait while our AI tutor reviews your work."}
        </p>

        <div className="space-y-4 text-left">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index}
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                  index === currentStep 
                    ? (isTeacher 
                        ? 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 translate-x-2 shadow-sm' 
                        : 'bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 translate-x-2 shadow-sm')
                    : index < currentStep 
                      ? 'opacity-40' 
                      : 'opacity-20'
                }`}
              >
                <div className={`transition-transform duration-300 ${index === currentStep ? 'scale-110' : ''}`}>
                  <Icon className={`w-6 h-6 ${
                    isTeacher ? 'text-stone-600 dark:text-stone-400' : 'text-slate-600 dark:text-slate-400'
                  }`} />
                </div>
                <span className={`font-medium text-lg ${
                  index === currentStep 
                    ? (isTeacher ? 'text-stone-800 dark:text-stone-200' : 'text-slate-900 dark:text-indigo-200')
                    : (isTeacher ? 'text-stone-400 dark:text-stone-600' : 'text-slate-400 dark:text-slate-600')
                }`}>
                  {step.text}
                </span>
                {index < currentStep && <CheckCircle2 className={`w-5 h-5 ml-auto ${
                  isTeacher ? 'text-emerald-500' : 'text-indigo-500'
                }`} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};