import React, { useState } from 'react';
import { ChevronDown, Lightbulb, BookOpen, PlayCircle, StopCircle } from 'lucide-react';
import { PracticeQuestion } from '../types';
import { speakText, stopSpeaking } from '../utils/audio';

interface PracticeCardProps {
  question: PracticeQuestion;
  index: number;
  persona: 'teacher' | 'student';
}

export const PracticeCard: React.FC<PracticeCardProps> = ({ question, index, persona }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const isTeacher = persona === 'teacher';

  const toggleReadExplanation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReading) { stopSpeaking(); setIsReading(false); } 
    else {
      speakText(`Question: ${question.question}. Answer: ${question.answer}. Explanation: ${question.explanation}`, () => setIsReading(false), () => setIsReading(true));
    }
  };

  return (
    <div 
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl ${
        isOpen 
          ? (isTeacher 
              ? 'bg-white dark:bg-stone-900 border-emerald-300 dark:border-emerald-800 ring-4 ring-emerald-50 dark:ring-emerald-900/20' 
              : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 ring-4 ring-indigo-50 dark:ring-indigo-900/10')
          : (isTeacher 
              ? 'bg-white dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-800' 
              : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600')
      }`}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none cursor-pointer group"
      >
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl transition-colors ${
            isOpen 
              ? (isTeacher ? 'bg-emerald-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md')
              : (isTeacher 
                  ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-600' 
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-300')
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
               isOpen 
                ? (isTeacher ? 'text-emerald-700 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400')
                : (isTeacher ? 'text-stone-400 dark:text-stone-500 group-hover:text-emerald-600' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500')
            }`}>Practice {index + 1}</span>
            <h4 className={`font-semibold text-lg mt-0.5 transition-colors ${
               isOpen 
                ? (isTeacher ? 'text-stone-900 dark:text-stone-100' : 'text-slate-900 dark:text-white')
                : (isTeacher ? 'text-stone-700 dark:text-stone-300 group-hover:text-stone-900' : 'text-slate-700 dark:text-slate-200 group-hover:text-white')
            }`}>{question.question}</h4>
          </div>
        </div>
        <div className={`transform transition-all duration-300 p-2 rounded-full ${
           isOpen 
             ? 'rotate-180 bg-stone-100 dark:bg-stone-800/50 text-stone-800 dark:text-white' 
             : 'text-stone-400 dark:text-slate-600 group-hover:bg-stone-50 dark:group-hover:bg-slate-800'
        }`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-6 pt-2 pl-[4.5rem]">
          <div className={`rounded-xl p-5 border ${
             isTeacher
              ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
              : 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                 <Lightbulb className="w-4 h-4 text-amber-500" />
                 <h5 className={`font-bold text-sm ${isTeacher ? 'text-stone-800 dark:text-stone-200' : 'text-slate-800 dark:text-slate-200'}`}>Explanation</h5>
              </div>
              <button 
                onClick={toggleReadExplanation}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${isReading ? 'text-amber-600 animate-pulse' : 'text-amber-500 hover:text-amber-700'}`}
                title="Play Audio Explanation"
              >
                {isReading ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                {isReading ? 'Stop' : 'Play Audio'}
              </button>
            </div>
            <div className="space-y-2">
              <p className={`font-bold text-base ${isTeacher ? 'text-stone-900 dark:text-stone-100' : 'text-slate-900 dark:text-white'}`}>Answer: {question.answer}</p>
              <p className={`text-sm leading-relaxed ${isTeacher ? 'text-stone-600 dark:text-stone-400' : 'text-slate-600 dark:text-slate-400'}`}>{question.explanation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};