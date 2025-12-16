import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Camera, BookOpen, RotateCcw, ChevronRight, ChevronLeft,
  AlertTriangle, BrainCircuit, Sparkles, Wand2, ScanLine, Eye,
  CheckCircle2, HelpCircle, FileCheck, Play, X as XIcon, Plus,
  Volume2, VolumeX, Download, Printer, Edit2, Moon, Sun,
  GraduationCap, Glasses, Zap, MessageSquare, SlidersHorizontal
} from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { AppState, GradingReport, GradingPreferences, ChatMessage } from './types';
import { analyzeHomework, reGradeProblem, sendChatMessage } from './services/geminiService';
import { processImage } from './utils/imageProcessing';
import { convertPdfToImages } from './utils/pdfProcessor';
import { playFanfareSound, playErrorSound } from './utils/audio';
import { downloadCSV } from './utils/exportUtils';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ProblemCard } from './components/ProblemCard';
import { PracticeCard } from './components/PracticeCard';
import { StepIndicator } from './components/StepIndicator';
import { AnnotationCanvas } from './components/AnnotationCanvas';
import { SubjectSelector } from './components/SubjectSelector';
import { PdfPageSelector } from './components/PdfPageSelector';
import { GradingSettings } from './components/GradingSettings';
import { ChatInterface } from './components/ChatInterface';

interface ProcessedPage {
  originalBase64: string;
  processedBase64: string;
  mimeType: string;
  id: string;
}

interface PdfSelectionState {
  isOpen: boolean;
  pages: File[];
  filename: string;
  context: 'homework' | 'solution';
}

function App() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  
  // Theme State
  const [persona, setPersona] = useState<'teacher' | 'student'>('teacher');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [homeworkPages, setHomeworkPages] = useState<ProcessedPage[]>([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [solutionPages, setSolutionPages] = useState<ProcessedPage[]>([]);
  const [useEnhancedImage, setUseEnhancedImage] = useState<boolean>(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingSolution, setIsDraggingSolution] = useState(false);
  
  const [pdfSelection, setPdfSelection] = useState<PdfSelectionState>({
    isOpen: false, pages: [], filename: '', context: 'homework'
  });

  const [useAnswerKey, setUseAnswerKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gradingPreferences, setGradingPreferences] = useState<GradingPreferences>({
    strictness: 'standard',
    focus: 'logic'
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [report, setReport] = useState<GradingReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const [annotatingProblemId, setAnnotatingProblemId] = useState<number | null>(null);
  const [isReGrading, setIsReGrading] = useState(false);
  const canvasSectionRef = useRef<HTMLDivElement>(null);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatTyping, setIsChatTyping] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const solutionInputRef = useRef<HTMLInputElement>(null);

  const isTeacher = persona === 'teacher';

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (appState === 'RESULTS' && soundEnabled) setTimeout(() => playFanfareSound(), 500);
    if (appState === 'ERROR' && soundEnabled) playErrorSound();
  }, [appState, soundEnabled]);

  const processFiles = async (files: FileList | File[], isSolution: boolean = false) => {
    setIsProcessingImage(true);
    try {
      const fileArray = Array.from(files);
      const newPages: ProcessedPage[] = [];

      for (const file of fileArray) {
        if (file.type === 'application/pdf') {
          const pdfPages = await convertPdfToImages(file);
          setPdfSelection({
            isOpen: true,
            pages: pdfPages,
            filename: file.name,
            context: isSolution ? 'solution' : 'homework'
          });
          setIsProcessingImage(false); 
          return; 
        }

        const { originalBase64, processedBase64 } = await processImage(file);
        newPages.push({
          originalBase64: `data:${file.type};base64,${originalBase64}`,
          processedBase64: `data:image/jpeg;base64,${processedBase64}`,
          mimeType: file.type,
          id: Math.random().toString(36).substr(2, 9)
        });
      }
      await new Promise(r => setTimeout(r, 800));

      if (isSolution) setSolutionPages(prev => [...prev, ...newPages]);
      else setHomeworkPages(prev => [...prev, ...newPages]);

      setIsProcessingImage(false);
    } catch (e) {
      console.error(e);
      setError("Failed to process files. Ensure they are valid images or PDFs.");
      setAppState('ERROR');
      setIsProcessingImage(false);
    }
  };

  const handlePdfSelectionConfirm = async (selectedIndices: number[]) => {
    const pagesToProcess = selectedIndices.map(i => pdfSelection.pages[i]);
    const context = pdfSelection.context;
    
    setPdfSelection(prev => ({ ...prev, isOpen: false }));
    setIsProcessingImage(true);

    try {
      const newPages: ProcessedPage[] = [];
      for (const imgFile of pagesToProcess) {
        const { originalBase64, processedBase64 } = await processImage(imgFile);
        newPages.push({
          originalBase64: `data:${imgFile.type};base64,${originalBase64}`,
          processedBase64: `data:image/jpeg;base64,${processedBase64}`,
          mimeType: imgFile.type,
          id: Math.random().toString(36).substr(2, 9)
        });
      }

      if (context === 'solution') setSolutionPages(prev => [...prev, ...newPages]);
      else setHomeworkPages(prev => [...prev, ...newPages]);

    } catch (e) {
      console.error(e);
      setError("Failed to process selected PDF pages.");
      setAppState('ERROR');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handlePdfSelectionCancel = () => {
    setPdfSelection(prev => ({ ...prev, isOpen: false }));
    setIsProcessingImage(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, isSolution: boolean = false) => {
    if (event.target.files && event.target.files.length > 0) processFiles(event.target.files, isSolution);
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, isSolution: boolean = false) => {
    e.preventDefault();
    if (isSolution) setIsDraggingSolution(true); else setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, isSolution: boolean = false) => {
    e.preventDefault();
    if (isSolution) setIsDraggingSolution(false); else setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isSolution: boolean = false) => {
    e.preventDefault();
    if (isSolution) setIsDraggingSolution(false); else setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files, isSolution);
  };

  const handleRemovePage = (id: string, isSolution: boolean) => {
    if (isSolution) setSolutionPages(prev => prev.filter(p => p.id !== id));
    else setHomeworkPages(prev => prev.filter(p => p.id !== id));
  };

  const analyzeImages = async () => {
    if (homeworkPages.length === 0) return;
    try {
      setAppState('ANALYZING');
      setError(null);
      const homeworkInputs = homeworkPages.map(p => ({ base64: p.processedBase64.split(',')[1], mimeType: 'image/jpeg' }));
      const solutionInputs = solutionPages.map(p => ({ base64: p.processedBase64.split(',')[1], mimeType: 'image/jpeg' }));
      const subjectHint = selectedSubjects.length > 0 ? selectedSubjects.join(', ') : "Auto-detect";
      
      const data = await analyzeHomework(
        homeworkInputs, 
        subjectHint, 
        solutionInputs.length > 0 ? solutionInputs : undefined,
        gradingPreferences
      );

      if (!data.isHomework) {
        setError("That doesn't look like homework! Please upload a clear photo or PDF.");
        setAppState('ERROR');
        return;
      }
      setReport(data);
      setAppState('RESULTS');
    } catch (err) {
      console.error(err);
      setError("Something went wrong while grading. Please check your internet connection.");
      setAppState('ERROR');
    }
  };

  const handleStartGrading = () => analyzeImages();
  const handleRetry = () => handleStartGrading();
  
  const resetApp = () => {
    setAppState('IDLE');
    setHomeworkPages([]);
    setSolutionPages([]);
    setReport(null);
    setError(null);
    setSelectedSubjects([]);
    setIsProcessingImage(false);
    setUseAnswerKey(false);
    setCurrentViewIndex(0);
    setAnnotatingProblemId(null);
    setChatMessages([]);
    setIsChatOpen(false);
  };

  const startAnnotation = (problemId: number) => {
    setAnnotatingProblemId(problemId);
    setTimeout(() => canvasSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const handleReGrade = async (imageDataBase64: string) => {
    if (!annotatingProblemId || !report) return;
    const problem = report.problems.find(p => p.id === annotatingProblemId);
    if (!problem) return;
    setIsReGrading(true);
    try {
      const updatedProblem = await reGradeProblem(imageDataBase64, problem, report.subject);
      const updatedProblems = report.problems.map(p => p.id === annotatingProblemId ? updatedProblem : p);
      setReport({ ...report, problems: updatedProblems });
      setAnnotatingProblemId(null);
    } catch (e) {
      console.error("Re-grading failed:", e);
    } finally {
      setIsReGrading(false);
    }
  };

  const handleSubjectChange = (newSubject: string) => {
    if (report) setReport({ ...report, subject: newSubject, subjectConfidenceScore: 1.0, alternativeSubjects: [] });
  };

  const handleChatSendMessage = async (text: string) => {
    if (!report) return;
    
    // Optimistic UI update
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    
    setIsChatTyping(true);
    try {
      const responseText = await sendChatMessage(
        [...chatMessages, userMsg],
        text,
        report
      );
      
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error("Chat error", e);
      setChatMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "I'm sorry, I encountered an error connecting to the AI. Please try again.", 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleDownloadCSV = () => { if (report) downloadCSV(report); };
  const handlePrint = () => window.print();
  const getCurrentStep = () => appState === 'IDLE' ? 1 : appState === 'ANALYZING' ? (isProcessingImage ? 2 : 3) : 4;

  const nextViewImage = () => { if (currentViewIndex < homeworkPages.length - 1) setCurrentViewIndex(prev => prev + 1); };
  const prevViewImage = () => { if (currentViewIndex > 0) setCurrentViewIndex(prev => prev - 1); };

  const currentDisplayPage = homeworkPages[currentViewIndex];
  const displayImageSrc = currentDisplayPage ? (useEnhancedImage ? currentDisplayPage.processedBase64 : currentDisplayPage.originalBase64) : null;

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${
      isTeacher 
        ? 'bg-paper text-stone-800 dark:bg-stone-950 dark:text-stone-100' 
        : 'bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 bg-grid'
    }`}>
      <LoadingOverlay isVisible={appState === 'ANALYZING' || isProcessingImage} isProcessingImage={isProcessingImage} persona={persona} />
      
      <PdfPageSelector 
        isOpen={pdfSelection.isOpen}
        pages={pdfSelection.pages}
        filename={pdfSelection.filename}
        context={pdfSelection.context}
        onConfirm={handlePdfSelectionConfirm}
        onCancel={handlePdfSelectionCancel}
        persona={persona}
      />

      <ChatInterface 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleChatSendMessage}
        isTyping={isChatTyping}
        persona={persona}
      />

      {/* Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 no-print border-b w-full px-4 sm:px-6 lg:px-8 ${
        isTeacher
          ? 'bg-[#fcfbf9]/95 dark:bg-stone-950/90 border-stone-200 dark:border-stone-800 backdrop-blur-xl'
          : 'bg-white/95 dark:bg-slate-950/90 border-slate-200 dark:border-slate-800 backdrop-blur-xl'
      }`}>
        <div className="w-full h-18 flex items-center justify-between py-3">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={resetApp}>
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${
              isTeacher
                ? 'bg-emerald-600 text-white shadow-md group-hover:bg-emerald-700'
                : 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] group-hover:shadow-[0_0_25px_rgba(79,70,229,0.7)]'
            }`}>
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${
              isTeacher 
                ? 'font-serif-theme text-stone-900 dark:text-stone-100' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400'
            }`}>
              ExamGrader
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
             {/* Theme Controls */}
             <div className={`flex items-center p-1 rounded-full border ${
               isTeacher ? 'bg-stone-200/50 dark:bg-stone-900 border-stone-300 dark:border-stone-700' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
             }`}>
               <button onClick={() => setPersona('teacher')} title="Teacher Persona" className={`p-2 rounded-full transition-all duration-300 ${persona === 'teacher' ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600'}`}><Glasses className="w-4 h-4" /></button>
               <button onClick={() => setPersona('student')} title="Student Persona" className={`p-2 rounded-full transition-all duration-300 ${persona === 'student' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600'}`}><Zap className="w-4 h-4" /></button>
               <div className="w-px h-4 mx-1 bg-stone-300 dark:bg-stone-700 opacity-50"></div>
               <button onClick={() => setDarkMode(!darkMode)} title="Toggle Dark Mode" className={`p-2 rounded-full transition-all duration-300 ${darkMode ? 'text-amber-400' : 'text-stone-500'}`}>{darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</button>
             </div>

             <div className={`h-6 w-px mx-2 ${isTeacher ? 'bg-stone-200 dark:bg-stone-800' : 'bg-slate-200 dark:bg-slate-800'}`}></div>

             <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-full transition-colors border ${
                soundEnabled 
                  ? (isTeacher 
                      ? 'text-stone-700 bg-stone-100 hover:bg-stone-200 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700' 
                      : 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 dark:bg-slate-800 dark:text-indigo-400 dark:border-slate-700') 
                  : (isTeacher ? 'text-stone-400 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800' : 'text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800')
              }`}
             >
               {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
             </button>

            {appState !== 'IDLE' && (
              <button 
                onClick={resetApp}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center space-x-2 ${
                  isTeacher
                    ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="step-indicator">
        <StepIndicator currentStep={getCurrentStep()} persona={persona} />
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        
        {/* IDLE STATE: Upload Zone */}
        {appState === 'IDLE' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up pb-12">
            <div className="text-center mb-10 max-w-xl">
              <div className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6 animate-pulse border ${
                isTeacher
                  ? 'bg-white text-emerald-700 border-emerald-200 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500/30'
              }`}>
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Grading Assistant</span>
              </div>
              <h2 className={`text-5xl sm:text-6xl font-extrabold mb-6 tracking-tight leading-tight ${
                isTeacher ? 'font-serif-theme text-stone-900 dark:text-stone-100' : 'text-slate-900 dark:text-white'
              }`}>
                Grade Answers <br/>
                <span className={`text-transparent bg-clip-text ${
                  isTeacher 
                    ? 'bg-gradient-to-r from-stone-700 via-emerald-600 to-stone-700 dark:from-stone-300 dark:via-emerald-400 dark:to-stone-300' 
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400'
                }`}>in seconds</span>
              </h2>
              <p className={`text-lg leading-relaxed ${isTeacher ? 'text-stone-600 dark:text-stone-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Upload images or PDFs. Get instant feedback, logic checks, and practice questions.
              </p>
            </div>

            <div className="w-full max-w-5xl flex flex-col space-y-5 relative z-10">
              <SubjectSelector selectedSubjects={selectedSubjects} onChange={setSelectedSubjects} persona={persona} />
              
              <div className="flex gap-4">
                <div className={`flex-1 flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                  isTeacher
                    ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm'
                }`} onClick={() => setUseAnswerKey(!useAnswerKey)}>
                  <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ease-in-out flex-shrink-0 ${
                    useAnswerKey 
                      ? (isTeacher ? 'bg-emerald-600' : 'bg-indigo-600') 
                      : (isTeacher ? 'bg-stone-200 dark:bg-stone-700' : 'bg-slate-200 dark:bg-slate-700')
                  }`}>
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${useAnswerKey ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${isTeacher ? 'text-stone-700 dark:text-stone-300' : 'text-slate-700 dark:text-slate-300'}`}>Answer Key</span>
                  </div>
                </div>

                <div className={`flex-1 flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                   showSettings 
                     ? (isTeacher ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-indigo-500 ring-2 ring-indigo-100')
                     : (isTeacher ? 'bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800')
                }`} onClick={() => setShowSettings(!showSettings)}>
                   <div className="flex items-center space-x-2">
                     <SlidersHorizontal className={`w-4 h-4 ${isTeacher ? 'text-stone-500' : 'text-slate-500'}`} />
                     <span className={`text-sm font-bold ${isTeacher ? 'text-stone-700 dark:text-stone-300' : 'text-slate-700 dark:text-slate-300'}`}>Rubric</span>
                   </div>
                   <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                     isTeacher ? 'bg-stone-100 text-stone-600' : 'bg-slate-100 text-slate-600'
                   }`}>{gradingPreferences.strictness}</span>
                </div>
              </div>

              {showSettings && (
                 <div className="animate-fade-in-up">
                    <GradingSettings preferences={gradingPreferences} onChange={setGradingPreferences} persona={persona} />
                 </div>
              )}

              {/* HOMEWORK Drop Zone */}
              <div 
                onDragOver={(e) => handleDragOver(e, false)}
                onDragLeave={(e) => handleDragLeave(e, false)}
                onDrop={(e) => handleDrop(e, false)}
                className={`w-full p-8 border-2 border-dashed rounded-[2rem] transition-all duration-300 relative overflow-hidden flex flex-col items-center cursor-pointer group
                  ${isDragging 
                    ? (isTeacher 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 scale-[1.02] shadow-lg' 
                        : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 scale-[1.02] shadow-xl')
                    : homeworkPages.length > 0
                      ? (isTeacher ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/5' : 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/5')
                      : (isTeacher
                          ? 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 hover:border-emerald-500 hover:bg-[#f8f7f5] dark:hover:bg-stone-800'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800')
                  }`}
                onClick={() => homeworkPages.length === 0 && fileInputRef.current?.click()}
              >
                {homeworkPages.length === 0 ? (
                    <div className="flex flex-col items-center w-full h-full">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                        isTeacher
                          ? 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 group-hover:bg-white dark:group-hover:bg-stone-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-105 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-105 shadow-sm'
                      }`}>
                        <Upload className="w-8 h-8" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${isTeacher ? 'text-stone-800 dark:text-stone-200' : 'text-slate-800 dark:text-slate-200'}`}>
                        Student Answers
                      </h3>
                      <p className={`text-center text-sm font-medium ${isTeacher ? 'text-stone-500 dark:text-stone-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        Drag & drop PDFs or Images here
                      </p>
                    </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className={`font-bold flex items-center ${isTeacher ? 'text-stone-700 dark:text-stone-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          <CheckCircle2 className={`w-5 h-5 mr-2 ${isTeacher ? 'text-emerald-500' : 'text-indigo-500'}`} />
                          {homeworkPages.length} Page{homeworkPages.length > 1 ? 's' : ''}
                       </h3>
                       <button 
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors flex items-center ${
                             isTeacher
                              ? 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                          }`}
                       >
                         <Plus className="w-3 h-3 mr-1" /> Add
                       </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {homeworkPages.map((page, idx) => (
                        <div key={page.id} className={`relative group aspect-[3/4] rounded-lg overflow-hidden border shadow-sm ${
                          isTeacher ? 'border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800' : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                        }`}>
                          <img src={page.processedBase64} alt={`Page ${idx+1}`} className="w-full h-full object-cover" />
                          <button onClick={(e) => { e.stopPropagation(); handleRemovePage(page.id, false); }} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform"><XIcon className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, false)} accept="image/*,application/pdf" className="hidden" multiple />
              </div>

              {/* SOLUTION Drop Zone */}
              {useAnswerKey && (
                <div 
                  onDragOver={(e) => handleDragOver(e, true)}
                  onDragLeave={(e) => handleDragLeave(e, true)}
                  onDrop={(e) => handleDrop(e, true)}
                  className={`w-full p-6 border-2 border-dashed rounded-[2rem] transition-all duration-300 relative overflow-hidden flex flex-col items-center mt-4 cursor-pointer group
                    ${isDraggingSolution 
                      ? (isTeacher ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 scale-[1.02]' : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 scale-[1.02]')
                      : solutionPages.length > 0
                        ? (isTeacher ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/5' : 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/5')
                        : (isTeacher
                            ? 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 hover:border-emerald-500 hover:bg-[#f8f7f5] dark:hover:bg-stone-800'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800')
                    }`}
                   onClick={() => solutionPages.length === 0 && solutionInputRef.current?.click()}
                >
                   {solutionPages.length === 0 ? (
                      <div className="flex flex-col items-center w-full h-full">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                          isTeacher
                            ? 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 group-hover:bg-white dark:group-hover:bg-stone-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}>
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <h3 className={`text-lg font-bold ${isTeacher ? 'text-stone-700 dark:text-stone-300' : 'text-slate-700 dark:text-slate-300'}`}>Answer Key (Optional)</h3>
                      </div>
                   ) : (
                     <div className="w-full">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`font-bold flex items-center ${isTeacher ? 'text-stone-700 dark:text-stone-300' : 'text-slate-700 dark:text-slate-300'}`}>
                              <CheckCircle2 className={`w-4 h-4 mr-2 ${isTeacher ? 'text-emerald-500' : 'text-indigo-500'}`} />
                              {solutionPages.length} Key Page{solutionPages.length > 1 ? 's' : ''}
                          </h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {solutionPages.map((page, idx) => (
                            <div key={page.id} className={`relative group aspect-[3/4] rounded-lg overflow-hidden border ${isTeacher ? 'border-stone-200 dark:border-stone-700' : 'border-slate-200 dark:border-slate-700'}`}>
                              <img src={page.processedBase64} alt={`Sol ${idx+1}`} className="w-full h-full object-cover" />
                              <button onClick={(e) => { e.stopPropagation(); handleRemovePage(page.id, true); }} className="absolute top-1 right-1 bg-rose-500 text-white p-0.5 rounded-full"><XIcon className="w-2.5 h-2.5" /></button>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                   <input type="file" ref={solutionInputRef} onChange={(e) => handleFileSelect(e, true)} accept="image/*,application/pdf" className="hidden" multiple />
                </div>
              )}

              <button
                onClick={handleStartGrading}
                disabled={homeworkPages.length === 0}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 mt-4
                  ${homeworkPages.length > 0
                    ? (isTeacher
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-1'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:-translate-y-1')
                    : (isTeacher 
                        ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600') + ' cursor-not-allowed'
                  }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Grading</span>
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {appState === 'ERROR' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
              isTeacher ? 'bg-rose-100 text-rose-500' : 'bg-rose-500/10 text-rose-500'
            }`}>
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${isTeacher ? 'text-stone-900 dark:text-stone-100' : 'text-slate-900 dark:text-white'}`}>Analysis Failed</h3>
            <p className={`max-w-md mb-8 ${isTeacher ? 'text-stone-500 dark:text-stone-400' : 'text-slate-500 dark:text-slate-400'}`}>{error}</p>
            <div className="flex gap-4">
              <button onClick={resetApp} className={`px-6 py-3 rounded-xl font-bold border ${isTeacher ? 'border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Cancel</button>
              <button onClick={handleRetry} className={`px-6 py-3 text-white rounded-xl font-bold ${isTeacher ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>Retry</button>
            </div>
          </div>
        )}

        {/* RESULTS STATE */}
        {appState === 'RESULTS' && report && (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: IMAGE VIEWER (Sticky) */}
            <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-36 space-y-6 no-print order-2 lg:order-1 h-fit" ref={canvasSectionRef}>
               {/* Image Card */}
               <div className={`rounded-[2rem] p-6 border shadow-lg overflow-hidden flex flex-col ${
                   isTeacher
                    ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-stone-200 dark:shadow-none'
                    : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                     <h4 className={`font-bold flex items-center ${
                       isTeacher ? 'text-stone-700 dark:text-stone-300' : 'text-slate-200'
                     }`}>
                      <Camera className="w-4 h-4 mr-2 opacity-70" /> Submitted Work
                    </h4>
                    {displayImageSrc && !annotatingProblemId && (
                      <button onClick={() => setUseEnhancedImage(!useEnhancedImage)} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                         isTeacher
                          ? 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}>
                        {useEnhancedImage ? <Eye className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{useEnhancedImage ? 'Original' : 'Enhanced'}</span>
                      </button>
                    )}
                  </div>
                  {displayImageSrc && (
                    <div className="relative group">
                      {annotatingProblemId ? (
                         <div className={`relative rounded-2xl overflow-hidden border-2 ${isTeacher ? 'border-emerald-500' : 'border-indigo-500'}`}>
                            <AnnotationCanvas imageSrc={displayImageSrc} onCancel={() => setAnnotatingProblemId(null)} onSubmit={handleReGrade} isSubmitting={isReGrading} persona={persona} />
                         </div>
                      ) : (
                        <>
                          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-zoom-in bg-black/5">
                              <img src={displayImageSrc} alt="Work" className="w-full h-full object-contain" />
                          </div>
                          
                          {/* Pagination Control Bar */}
                          {homeworkPages.length > 1 && (
                            <div className={`flex items-center justify-between mt-4 border-t pt-4 ${
                              isTeacher ? 'border-stone-100 dark:border-stone-800' : 'border-slate-800'
                            }`}>
                               <button
                                 onClick={prevViewImage}
                                 disabled={currentViewIndex === 0}
                                 className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                   currentViewIndex === 0
                                     ? 'opacity-50 cursor-not-allowed text-stone-300 dark:text-slate-600'
                                     : isTeacher 
                                        ? 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300' 
                                        : 'hover:bg-slate-800 text-slate-300'
                                 }`}
                               >
                                 <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                               </button>
                               
                               <span className={`text-xs font-medium ${isTeacher ? 'text-stone-400 dark:text-stone-500' : 'text-slate-500'}`}>
                                 {currentViewIndex + 1} / {homeworkPages.length}
                               </span>
                          
                               <button
                                 onClick={nextViewImage}
                                 disabled={currentViewIndex === homeworkPages.length - 1}
                                 className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                   currentViewIndex === homeworkPages.length - 1
                                     ? 'opacity-50 cursor-not-allowed text-stone-300 dark:text-slate-600'
                                     : isTeacher 
                                        ? 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300' 
                                        : 'hover:bg-slate-800 text-slate-300'
                                 }`}
                               >
                                 Next <ChevronRight className="w-4 h-4 ml-1" />
                               </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
               </div>
            </div>

            {/* RIGHT COLUMN: CONTENT */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-8 order-1 lg:order-2">
               
               {/* 1. Score Overview */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Summary Card */}
                 <div className={`col-span-1 md:col-span-2 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl ${
                    isTeacher
                      ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-800'
                      : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 text-white border border-indigo-500/20'
                  }`}>
                    {/* Decorative Elements */}
                    {!isTeacher && <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>}
                    {isTeacher && <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>}
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded-lg ${isTeacher ? 'bg-stone-100 dark:bg-stone-800' : 'bg-white/10'}`}>
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="relative group/subject">
                            <span className={`text-sm font-bold uppercase tracking-wider cursor-pointer border-b border-dashed transition-colors ${
                              isTeacher 
                                ? 'border-stone-300 hover:text-emerald-600 hover:border-emerald-600 dark:border-stone-600 dark:hover:text-emerald-400' 
                                : 'border-white/30 hover:text-white hover:border-white'
                            }`}>
                              {report.subject}
                            </span>
                            {(report.alternativeSubjects && report.alternativeSubjects.length > 0) && (
                               <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl shadow-xl border p-2 hidden group-hover/subject:block z-50 animate-fade-in-up ${
                                 isTeacher
                                  ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                                  : 'bg-slate-900 border-slate-700'
                               }`}>
                                  <p className={`text-[10px] opacity-50 font-bold px-3 py-1 uppercase ${isTeacher ? 'text-stone-500' : 'text-slate-400'}`}>Did you mean?</p>
                                  {report.alternativeSubjects.map(s => (
                                      <button key={s} onClick={() => handleSubjectChange(s)} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                                        isTeacher ? 'hover:bg-stone-100 dark:hover:bg-stone-800' : 'hover:bg-indigo-500/10'
                                      }`}>{s}</button>
                                  ))}
                               </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 no-print">
                          <button onClick={handleDownloadCSV} className={`p-2 rounded-lg transition-colors ${
                            isTeacher ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700' : 'bg-white/10 hover:bg-white/20'
                          }`}><Download className="w-5 h-5" /></button>
                          <button onClick={handlePrint} className={`p-2 rounded-lg transition-colors ${
                            isTeacher ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700' : 'bg-white/10 hover:bg-white/20'
                          }`}><Printer className="w-5 h-5" /></button>
                        </div>
                      </div>

                      <h2 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${isTeacher ? 'font-serif-theme' : ''}`}>
                        {report.totalScore >= 90 ? "Excellent!" : report.totalScore >= 70 ? "Good Job!" : "Keep Going!"}
                      </h2>
                      <p className="text-lg opacity-80 mb-8 max-w-xl leading-relaxed">{report.summary}</p>
                      
                      <div className="flex gap-4">
                        <div className={`px-5 py-3 rounded-2xl border ${
                          isTeacher 
                            ? 'bg-stone-50 border-stone-100 dark:bg-stone-800 dark:border-stone-700' 
                            : 'bg-white/5 backdrop-blur-md border-white/10'
                        }`}>
                          <span className="text-xs opacity-60 uppercase tracking-wider block mb-1">Correct</span>
                          <span className="text-2xl font-bold">{report.problems.filter(p => p.isCorrect).length} <span className="text-sm opacity-50">/ {report.problems.length}</span></span>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Score Circle */}
                 <div className={`col-span-1 rounded-[2rem] p-8 border flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 ${
                    isTeacher
                      ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-xl shadow-stone-200/50 dark:shadow-none'
                      : 'bg-slate-900 border-slate-800'
                 }`}>
                   <span className={`font-bold text-xs uppercase tracking-widest mb-6 ${
                     isTeacher ? 'text-stone-400 dark:text-stone-500' : 'text-slate-500'
                   }`}>Total Score</span>
                   <div className="relative mb-4">
                     <svg className="w-40 h-40 transform -rotate-90">
                       <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className={isTeacher ? 'text-stone-100 dark:text-stone-800' : 'text-slate-800'} />
                       <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * report.totalScore) / 100} strokeLinecap="round" className={`${report.totalScore >= 80 ? 'text-emerald-500' : report.totalScore >= 60 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out`} />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                       <span className={`text-5xl font-extrabold tracking-tight ${
                         isTeacher ? 'text-stone-800 dark:text-stone-100' : 'text-white'
                       }`}>{report.totalScore}</span>
                     </div>
                   </div>
                   <div className={`px-4 py-1 rounded-full text-sm font-bold ${
                      report.totalScore >= 80 ? 'bg-emerald-100 text-emerald-700' : report.totalScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                   }`}>Grade: {report.letterGrade}</div>
                 </div>
               </div>

               {/* 2. Practice Questions */}
               <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-8 w-1.5 bg-amber-500 rounded-full"></div>
                    <h3 className={`text-2xl font-bold ${isTeacher ? 'font-serif-theme text-stone-800 dark:text-stone-100' : 'text-white'}`}>Practice</h3>
                  </div>
                  <Virtuoso
                    useWindowScroll
                    data={report.practiceQuestions}
                    itemContent={(index, q) => (
                      <div className="pb-4">
                        <PracticeCard key={index} question={q} index={index} persona={persona} />
                      </div>
                    )}
                  />
               </div>

               {/* 3. Detailed Breakdown */}
               <div>
                 <div className="flex items-center space-x-3 mb-6">
                   <div className={`h-8 w-1.5 rounded-full ${isTeacher ? 'bg-stone-800 dark:bg-stone-200' : 'bg-indigo-500'}`}></div>
                   <h3 className={`text-2xl font-bold ${isTeacher ? 'font-serif-theme text-stone-800 dark:text-stone-100' : 'text-white'}`}>Detailed Breakdown</h3>
                 </div>
                 <Virtuoso
                   useWindowScroll
                   data={report.problems}
                   computeItemKey={(index, problem) => problem.id}
                   itemContent={(index, problem) => (
                     <div className="pb-6 break-inside-avoid">
                       <ProblemCard 
                         problem={problem} 
                         index={index} 
                         onAnnotate={startAnnotation} 
                         isAnnotating={annotatingProblemId === problem.id} 
                         soundEnabled={soundEnabled} 
                         persona={persona} 
                       />
                     </div>
                   )}
                 />
               </div>
            
            </div>

            {/* Ask Tutor Button (Floating) - Only show when chat is closed */}
            {!isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className={`fixed bottom-6 right-6 pl-4 pr-5 py-4 rounded-full shadow-2xl z-40 transition-all duration-300 hover:scale-105 flex items-center gap-3 group animate-fade-in-up ${
                  isTeacher 
                    ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' 
                    : 'bg-indigo-600 text-white shadow-indigo-500/50 hover:bg-indigo-700'
                }`}
              >
                <div className="relative">
                  <MessageSquare className="w-6 h-6" />
                  {chatMessages.length === 0 && (
                     <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                     </span>
                  )}
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-bold text-sm">
                  Ask AI Tutor
                </span>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
export default App;