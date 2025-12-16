  import React, { useState, useRef, useEffect, useMemo } from 'react';
  import { X, Check, ChevronDown, Plus, Search, Hash } from 'lucide-react';

  const SUBJECT_GROUPS: Record<string, string[]> = {
    "Math": ["Algebra", "Geometry", "Calculus", "Statistics", "Trigonometry", "General Math"],
    "Science": ["Physics", "Chemistry", "Biology", "Environmental Science", "General Science"],
    "Humanities": ["History", "Geography", "Economics", "Psychology", "Social Studies"],
    "Language": ["Literature", "Grammar", "Composition", "Foreign Language"],
    "Technology": ["Computer Science", "Coding", "Engineering"],
    "Arts": ["Art History", "Music Theory", "Visual Arts"],
  };

  interface SubjectSelectorProps {
    selectedSubjects: string[];
    onChange: (subjects: string[]) => void;
    className?: string;
    persona: 'teacher' | 'student';
  }

  export const SubjectSelector: React.FC<SubjectSelectorProps> = ({ selectedSubjects, onChange, className, persona }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    const isTeacher = persona === 'teacher';

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSubject = (subject: string) => {
      if (selectedSubjects.includes(subject)) onChange(selectedSubjects.filter(s => s !== subject));
      else { onChange([...selectedSubjects, subject]); setSearchTerm(''); }
    };

    const removeSubject = (subject: string, e: React.MouseEvent) => {
      e.stopPropagation(); onChange(selectedSubjects.filter(s => s !== subject));
    };

    const handleCustomAdd = () => {
      if (searchTerm.trim() && !selectedSubjects.includes(searchTerm.trim())) onChange([...selectedSubjects, searchTerm.trim()]);
      setSearchTerm('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleCustomAdd(); }
      if (e.key === 'Backspace' && searchTerm === '' && selectedSubjects.length > 0) onChange(selectedSubjects.slice(0, -1));
    };

    const filteredGroupsList = useMemo(() => {
      if (!searchTerm.trim()) {
        return Object.entries(SUBJECT_GROUPS);
      }

      const termLower = searchTerm.trim().toLowerCase();
      const allSubjects = Object.values(SUBJECT_GROUPS).flat();

      const matches = allSubjects.filter(s => s.toLowerCase().includes(termLower));

      // Sort: Exact match -> Starts with -> Alphabetical
      matches.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        // 1. Exact match priority
        if (aLower === termLower && bLower !== termLower) return -1;
        if (bLower === termLower && aLower !== termLower) return 1;

        // 2. Starts with priority
        const aStarts = aLower.startsWith(termLower);
        const bStarts = bLower.startsWith(termLower);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // 3. Alphabetical
        return a.localeCompare(b);
      });

      return matches.length > 0 ? [['Best Matches', matches]] as [string, string[]][] : [];
    }, [searchTerm]);

    const hasExactMatch = Object.values(SUBJECT_GROUPS).flat().some(s => s.toLowerCase() === searchTerm.toLowerCase()) || selectedSubjects.includes(searchTerm);

    return (
      <div className={`relative ${className || ''}`} ref={wrapperRef}>
        <div 
          className={`min-h-[64px] w-full rounded-[1.25rem] py-2 px-4 flex flex-wrap items-center gap-2 cursor-text focus-within:ring-4 transition-all duration-300 border relative group ${
            isTeacher 
              ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 focus-within:ring-stone-100 dark:focus-within:ring-stone-800 focus-within:border-stone-400 dark:focus-within:border-stone-500 hover:border-stone-300 dark:hover:border-stone-600'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:ring-indigo-50 dark:focus-within:ring-indigo-900/30 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          onClick={() => { setIsOpen(true); wrapperRef.current?.querySelector('input')?.focus(); }}
        >
          {selectedSubjects.length === 0 && !searchTerm && (
            <div className={`absolute left-5 pointer-events-none flex items-center ${
              isTeacher ? 'text-stone-400 dark:text-stone-500' : 'text-slate-400 dark:text-slate-500'
            }`}>
              <Search className="w-4 h-4 mr-2 opacity-50" />
              <span className="opacity-70 font-medium">Auto-detect subject (or type to add...)</span>
            </div>
          )}

          {selectedSubjects.map(subject => (
            <span key={subject} className={`flex items-center px-3 py-1.5 rounded-full text-sm font-bold border shadow-sm ${
              isTeacher
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border-indigo-100 dark:border-indigo-800/50'
            }`}>
              {subject}
              <button onClick={(e) => removeSubject(subject, e)} className={`ml-1.5 transition-colors ${
                isTeacher ? 'text-stone-400 hover:text-rose-500' : 'text-indigo-400 hover:text-indigo-600 dark:hover:text-white'
              }`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            className={`flex-grow bg-transparent outline-none min-w-[120px] py-2 pl-1 h-full z-10 ${
              isTeacher ? 'text-stone-800 dark:text-stone-100 placeholder-stone-400' : 'text-slate-800 dark:text-slate-100 placeholder-slate-400'
            }`}
          />
          <div className={`absolute right-4 pointer-events-none pl-2 border-l ${
            isTeacher ? 'text-stone-400 border-stone-100 dark:border-stone-800' : 'text-slate-400 border-slate-100 dark:border-slate-800'
          }`}>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isOpen && (
          <div className={`absolute z-50 top-full left-0 right-0 mt-3 rounded-2xl shadow-xl max-h-80 overflow-y-auto overflow-x-hidden animate-fade-in-up border ${
            isTeacher
              ? 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-700 dark:shadow-black/50'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 dark:shadow-black/50'
          }`}>
            {searchTerm && !hasExactMatch && (
              <div className={`px-4 py-3 cursor-pointer font-bold flex items-center transition-colors ${
                isTeacher 
                  ? 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-indigo-400'
              }`} onClick={handleCustomAdd}>
                <Plus className="w-4 h-4 mr-2" /> Add custom subject "{searchTerm}"
              </div>
            )}
            {filteredGroupsList.length === 0 && !searchTerm && selectedSubjects.length === 0 && (
              <div className={`px-4 py-8 text-sm text-center italic ${
                isTeacher ? 'text-stone-400' : 'text-slate-400'
              }`}>Start typing to search subjects...</div>
            )}
            {filteredGroupsList.map(([group, subjects]) => (
              <div key={group} className="py-2">
                <div className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isTeacher
                    ? 'text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-800/50'
                    : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50'
                }`}>{group}</div>
                {subjects.map(subject => {
                  const isSelected = selectedSubjects.includes(subject);
                  return (
                    <div key={subject} onClick={() => toggleSubject(subject)} className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected 
                        ? (isTeacher ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200' : 'bg-slate-100 dark:bg-indigo-900/20 text-slate-800 dark:text-indigo-300')
                        : (isTeacher ? 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400')
                    }`}>
                      <span className="flex items-center"><Hash className={`w-3.5 h-3.5 mr-2 ${isSelected ? 'opacity-100' : 'opacity-50'}`} />{subject}</span>
                      {isSelected && <Check className="w-4 h-4 opacity-70" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };