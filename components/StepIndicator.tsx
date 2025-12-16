import React from 'react';
import { Upload, Wand2, BrainCircuit, FileText, Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  persona: 'teacher' | 'student';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, persona }) => {
  const isTeacher = persona === 'teacher';
  
  const steps = [
    { id: 1, label: 'Upload', icon: Upload },
    { id: 2, label: 'Enhance', icon: Wand2 },
    { id: 3, label: 'Grade', icon: BrainCircuit },
    { id: 4, label: 'Results', icon: FileText },
  ];

  return (
    <div className={`sticky top-[72px] z-30 backdrop-blur-md border-b transition-all duration-300 ${
      isTeacher 
        ? 'bg-white/90 dark:bg-stone-950/80 border-stone-100 dark:border-stone-800' 
        : 'bg-white/90 dark:bg-slate-950/80 border-slate-100 dark:border-slate-800'
    }`}>
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="relative flex items-center justify-between">
          <div className={`absolute left-0 top-[22px] w-full h-1 rounded-full -z-10 ${
            isTeacher ? 'bg-stone-100 dark:bg-stone-800' : 'bg-slate-100 dark:bg-slate-800'
          }`}></div>
          <div 
            className={`absolute left-0 top-[22px] h-1 rounded-full -z-10 transition-all duration-700 ease-out ${
              isTeacher 
                ? 'bg-emerald-600 dark:bg-emerald-500' 
                : 'bg-indigo-600 dark:bg-indigo-500 dark:shadow-[0_0_10px_rgba(99,102,241,0.5)]'
            }`}
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div key={step.id} className="relative flex flex-col items-center group cursor-default">
                 <div className={`p-1.5 rounded-full z-10 transition-colors duration-300 ${
                   isTeacher ? 'bg-white dark:bg-stone-900' : 'bg-white dark:bg-slate-950'
                 }`}> 
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isActive 
                          ? (isTeacher 
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none' 
                              : 'border-indigo-600 bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50')
                          : isCompleted 
                            ? (isTeacher
                                ? 'border-emerald-600 text-emerald-600 bg-white dark:bg-stone-900'
                                : 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900')
                            : (isTeacher
                                ? 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-300 dark:text-stone-500'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600')
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                 </div>
                <span className={`text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-wider transition-colors duration-300 ${
                   isActive 
                    ? (isTeacher ? 'text-stone-800 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-300') 
                    : isCompleted 
                      ? (isTeacher ? 'text-emerald-700 dark:text-emerald-500' : 'text-indigo-600 dark:text-indigo-400') 
                      : (isTeacher ? 'text-stone-300 dark:text-stone-700' : 'text-slate-300 dark:text-slate-700')
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};