import React, { useRef, useEffect, useState } from 'react';
import { Check, X, RotateCcw, PenTool, Eraser } from 'lucide-react';

interface AnnotationCanvasProps {
  imageSrc: string;
  onCancel: () => void;
  onSubmit: (imageData: string) => void;
  isSubmitting: boolean;
  persona: 'teacher' | 'student';
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ 
  imageSrc, 
  onCancel, 
  onSubmit,
  isSubmitting,
  persona
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const isTeacher = persona === 'teacher';

  // Initialize canvas with image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    
    img.onload = () => {
      setImgElement(img);
      initializeCanvas(img);
    };
  }, [imageSrc]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (imgElement) {
        initializeCanvas(imgElement);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imgElement]);

  const initializeCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get container dimensions
    const containerWidth = container.clientWidth;
    // Calculate height to maintain aspect ratio
    const aspectRatio = img.height / img.width;
    const containerHeight = containerWidth * aspectRatio;

    // Set display size (css pixels)
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#f87171'; // Lighter Red (Red-400) for better visibility
      ctx.lineWidth = 4;
      
      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setContext(ctx);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    const { x, y } = getCoordinates(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    if (context && imgElement && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.drawImage(imgElement, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleSubmit = () => {
    if (canvasRef.current) {
      // Export at 0.8 quality jpeg
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      // Remove header for the API
      const base64 = dataUrl.split(',')[1];
      onSubmit(base64);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className={`px-4 py-3 rounded-xl flex items-center justify-between shadow-md text-white ${
        isTeacher ? 'bg-emerald-600' : 'bg-indigo-600'
      }`}>
        <div className="flex items-center space-x-2">
          <PenTool className="w-5 h-5" />
          <span className="font-bold text-sm">Annotation Mode</span>
        </div>
        <p className={`text-xs hidden sm:block ${isTeacher ? 'text-emerald-100' : 'text-indigo-100'}`}>Draw on the image to highlight the answer</p>
      </div>

      <div 
        ref={containerRef} 
        className={`relative w-full overflow-hidden rounded-xl border-2 shadow-xl cursor-crosshair touch-none ${
          isTeacher 
            ? 'border-emerald-500 bg-stone-100 dark:bg-stone-800' 
            : 'border-indigo-500 bg-slate-100 dark:bg-slate-800'
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full block"
        />
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={clearCanvas}
          disabled={isSubmitting}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border font-bold transition-colors disabled:opacity-50 ${
            isTeacher
              ? 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
              : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear</span>
        </button>
        
        <button 
          onClick={onCancel}
          disabled={isSubmitting}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border font-bold transition-colors disabled:opacity-50 ${
            isTeacher
              ? 'border-rose-200 bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100'
              : 'border-rose-200 bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100'
          }`}
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`flex-[2] flex items-center justify-center space-x-2 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-wait ${
             isSubmitting ? 'animate-pulse' : ''
          } ${
            isTeacher 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600'
          }`}
        >
          {isSubmitting ? (
             <span>Analyzing...</span>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Submit & Re-grade</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};