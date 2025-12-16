import React, { useState } from 'react';
import { Check, X, AlertCircle, CheckCircle2, Copy, PenTool, Volume2, PlayCircle, StopCircle } from 'lucide-react';
import { GradedProblem } from '../types';
import { playPositiveSound, playNeutralSound, speakText, stopSpeaking } from '../utils/audio';

interface ProblemCardProps {
  problem: GradedProblem;
  index: number;
  onAnnotate?: (problemId: number) => void;
  isAnnotating?: boolean;
  soundEnabled?: boolean;
  persona: 'teacher' | 'student';
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, index, onAnnotate, isAnnotating, soundEnabled, persona }) => {
  const [copiedSection, setCopiedSection] = useState<'student' | 'correct' | 'feedback' | null>(null);
  const [isReadingFeedback, setIsReadingFeedback] = useState(false);

  const isTeacher = persona === 'teacher';

  const handleCopy = async (text: string, section: 'student' | 'correct' | 'feedback') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handlePlaySound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!soundEnabled) return;
    problem.isCorrect ? playPositiveSound() : playNeutralSound();
  };

  const toggleReadFeedback = () => {
    if (isReadingFeedback) {
      stopSpeaking();
      setIsReadingFeedback(false);
    } else {
      speakText(problem.feedback, () => setIsReadingFeedback(false), () => setIsReadingFeedback(true));
    }
  };

  // Dynamic Class Helpers
  const cardBase = isTeacher 
    ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800' 
    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';
    
  const correctStyle = isTeacher
    ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10 dark:border-emerald-900/30 shadow-sm hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/10'
    : 'border-emerald-100 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-900/30 shadow-sm hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20';

  const incorrectStyle = isTeacher
    ? 'border-rose-200 bg-rose-50/30 dark:bg-rose-900/10 dark:border-rose-900/30 shadow-sm hover:shadow-rose-100/50 dark:hover:shadow-rose-900/10'
    : 'border-rose-100 bg-rose-50/50 dark:bg-rose-900/10 dark:border-rose-900/30 shadow-sm hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20';

  const activeRing = isTeacher
    ? 'ring-4 ring-emerald-100 border-emerald-300 dark:ring-emerald-900/20 dark:border-emerald-700'
    : 'ring-4 ring-indigo-100 border-indigo-300 dark:ring-indigo-500/30 dark:border-indigo-500';

  return (
    <div className={`group relative overflow-hidden rounded-[1.5rem] border-2 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl ${
      isAnnotating 
        ? `${activeRing} z-10` 
        : problem.isCorrect 
          ? correctStyle 
          : incorrectStyle
    } ${!problem.isCorrect && !problem.isCorrect && !isAnnotating ? (isTeacher ? 'bg-white dark:bg-stone-900' : 'bg-white dark:bg-slate-900') : ''}`}>
      
      {/* Colored Left Strip Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${problem.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

      <div className="p-6 pl-8">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start space-x-4 w-full mr-4">
            <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm border mt-1 ${
              problem.isCorrect 
                ? (isTeacher ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800')
                : (isTeacher ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800')
            }`}>
              {index + 1}
            </span>
            <h4 className={`font-semibold text-lg leading-snug break-words w-full ${isTeacher ? 'text-stone-800 dark:text-stone-100' : 'text-slate-800 dark:text-slate-100'}`}>
              {problem.questionText}
            </h4>
          </div>
          <div className={`flex-shrink-0 flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
            problem.isCorrect 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300' 
              : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300'
          }`}>
            {problem.isCorrect ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
            {problem.isCorrect ? "Correct" : "Incorrect"}
            {soundEnabled && (
              <button 
                onClick={handlePlaySound}
                className="ml-2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                title="Play feedback sound"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Student Answer */}
          <div className={`p-4 rounded-xl border ${
            problem.isCorrect 
              ? (isTeacher ? 'bg-stone-50 border-stone-100 dark:bg-stone-950 dark:border-stone-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-800')
              : (isTeacher ? 'bg-rose-50/30 border-rose-200 ring-2 ring-rose-50 dark:bg-rose-900/10 dark:border-rose-900/30 dark:ring-rose-900/10' : 'bg-rose-50/50 border-rose-100 ring-2 ring-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30 dark:ring-0')
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${problem.isCorrect ? (isTeacher ? 'text-stone-400 dark:text-stone-500' : 'text-slate-400 dark:text-slate-500') : 'text-rose-500 dark:text-rose-400'}`}>
                Your Answer
              </span>
              {!problem.isCorrect && (
                <button 
                  onClick={() => handleCopy(problem.studentResponse, 'student')}
                  className={`p-1 px-2 text-xs font-bold border rounded bg-white transition-all flex items-center gap-1 ${
                    isTeacher 
                      ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:bg-stone-800 dark:border-stone-700 dark:text-rose-400' 
                      : 'border-rose-200 text-rose-500 hover:bg-rose-50 dark:bg-slate-800 dark:border-rose-800 dark:text-rose-400'
                  }`}
                  title="Copy Student Answer"
                >
                  {copiedSection === 'student' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              )}
            </div>
            <div className={`font-medium ${problem.isCorrect ? (isTeacher ? 'text-stone-700 dark:text-stone-200' : 'text-slate-700 dark:text-slate-300') : 'text-rose-700 dark:text-rose-300'}`}>
              {problem.studentResponse || "(No answer detected)"}
            </div>
          </div>
          
          {/* Correct Answer */}
          {!problem.isCorrect && (
            <div className={`p-4 rounded-xl border ${
              isTeacher ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Correct Answer</span>
                <button 
                  onClick={() => handleCopy(problem.correctResponse, 'correct')}
                  className={`p-1 px-2 text-xs font-bold border rounded bg-white transition-all flex items-center gap-1 ${
                    isTeacher 
                      ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:bg-stone-800 dark:border-stone-700 dark:text-emerald-400' 
                      : 'border-emerald-200 text-emerald-500 hover:bg-emerald-50 dark:bg-slate-800 dark:border-emerald-800 dark:text-emerald-400'
                  }`}
                  title="Copy Correct Answer"
                >
                  {copiedSection === 'correct' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="font-medium text-emerald-800 dark:text-emerald-200">
                {problem.correctResponse}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        {!problem.isCorrect ? (
          <div className="flex flex-col space-y-4">
             <div className={`p-5 rounded-2xl border ${
               isTeacher 
                ? 'bg-stone-50 dark:bg-stone-800/50 border-stone-100 dark:border-stone-700' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
             }`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
                     <AlertCircle className="w-4 h-4" />
                     <span className="text-sm font-bold uppercase tracking-wide">Analysis</span>
                  </div>
                  <div className="flex space-x-2">
                     <button onClick={toggleReadFeedback} className={`p-1 px-2 text-xs font-bold border rounded bg-white transition-all flex items-center gap-1 ${
                        isTeacher 
                          ? 'border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-stone-800 dark:border-stone-600 dark:text-stone-300'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                     }`} title="Play Audio Explanation">
                        {isReadingFeedback ? <StopCircle className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                        <span>Play Audio</span>
                     </button>
                     <button onClick={() => handleCopy(problem.feedback, 'feedback')} className={`p-1 px-2 text-xs font-bold border rounded bg-white transition-all flex items-center gap-1 ${
                        isTeacher
                          ? 'border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-stone-800 dark:border-stone-600 dark:text-stone-300'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                     }`} title="Copy Feedback">
                        {copiedSection === 'feedback' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                     </button>
                  </div>
                </div>
                <p className={`${isTeacher ? 'text-stone-700 dark:text-stone-300' : 'text-slate-700 dark:text-slate-300'} leading-relaxed`}>{problem.feedback}</p>
            </div>
            
            {onAnnotate && (
              <button 
                onClick={() => onAnnotate(problem.id)}
                className={`self-end flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isTeacher
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Annotate & Retry</span>
              </button>
            )}
          </div>
        ) : (
          <div className={`p-5 rounded-2xl flex gap-3 border ${
             isTeacher
              ? 'bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-900/20'
              : 'bg-emerald-50/30 dark:bg-emerald-900/5 border-emerald-100/50 dark:border-emerald-900/20'
          }`}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                 <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Feedback</span>
                 <button onClick={toggleReadFeedback} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300" title="Play Audio">
                   {isReadingFeedback ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                 </button>
              </div>
              <p className={`text-sm leading-relaxed ${isTeacher ? 'text-stone-600 dark:text-stone-400' : 'text-slate-600 dark:text-slate-400'}`}>{problem.feedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};