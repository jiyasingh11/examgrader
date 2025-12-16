
import React from 'react';
import { Settings, Scale, Focus } from 'lucide-react';
import { GradingPreferences, StrictnessLevel, GradingFocus } from '../types';

interface GradingSettingsProps {
  preferences: GradingPreferences;
  onChange: (prefs: GradingPreferences) => void;
  persona: 'teacher' | 'student';
}

export const GradingSettings: React.FC<GradingSettingsProps> = ({ preferences, onChange, persona }) => {
  const isTeacher = persona === 'teacher';

  const updateStrictness = (level: StrictnessLevel) => onChange({ ...preferences, strictness: level });
  const updateFocus = (focus: GradingFocus) => onChange({ ...preferences, focus: focus });

  return (
    <div className={`w-full max-w-lg p-6 rounded-2xl border transition-all duration-300 ${
      isTeacher 
        ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
    }`}>
      <div className="flex items-center space-x-2 mb-6">
        <Settings className={`w-5 h-5 ${isTeacher ? 'text-stone-500' : 'text-slate-500'}`} />
        <h3 className={`font-bold text-lg ${isTeacher ? 'text-stone-800 dark:text-stone-100' : 'text-slate-800 dark:text-white'}`}>
          Grading Rubric
        </h3>
      </div>

      <div className="space-y-6">
        {/* Strictness Selector */}
        <div>
          <label className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-wider mb-3 ${
             isTeacher ? 'text-stone-500' : 'text-slate-500'
          }`}>
            <Scale className="w-4 h-4" />
            <span>Strictness Level</span>
          </label>
          <div className="flex rounded-xl p-1 border bg-opacity-50 space-x-1 overflow-hidden">
             {(['lenient', 'standard', 'strict'] as StrictnessLevel[]).map((level) => {
               const isActive = preferences.strictness === level;
               return (
                 <button
                   key={level}
                   onClick={() => updateStrictness(level)}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize ${
                     isActive
                       ? (isTeacher 
                           ? 'bg-emerald-100 text-emerald-800 shadow-sm' 
                           : 'bg-indigo-600 text-white shadow-md')
                       : (isTeacher
                           ? 'text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                           : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')
                   }`}
                 >
                   {level}
                 </button>
               );
             })}
          </div>
          <p className={`text-xs mt-2 ${isTeacher ? 'text-stone-400' : 'text-slate-400'}`}>
            {preferences.strictness === 'lenient' && "Forgives minor errors. Rewards effort and partial logic."}
            {preferences.strictness === 'standard' && "Balanced grading. Checks for correct answers and basic work."}
            {preferences.strictness === 'strict' && "High precision required. Penalizes formatting and logic gaps."}
          </p>
        </div>

        {/* Focus Selector */}
        <div>
           <label className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-wider mb-3 ${
             isTeacher ? 'text-stone-500' : 'text-slate-500'
           }`}>
            <Focus className="w-4 h-4" />
            <span>Grading Focus</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['result', 'logic', 'formatting'] as GradingFocus[]).map((focus) => {
               const isActive = preferences.focus === focus;
               return (
                 <button
                   key={focus}
                   onClick={() => updateFocus(focus)}
                   className={`py-2 px-3 text-sm font-bold rounded-xl border transition-all capitalize ${
                      isActive
                        ? (isTeacher
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300')
                        : (isTeacher
                            ? 'bg-white border-stone-200 text-stone-500 hover:border-stone-300 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-400'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400')
                   }`}
                 >
                   {focus}
                 </button>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
