import * as pdfjsLib from 'pdfjs-dist';

// Helper to resolve the library instance correctly across different module systems
const getPdfLib = (): any => {
  const lib = pdfjsLib as any;
  if (lib.GlobalWorkerOptions) {
    return lib;
  }
  if (lib.default && lib.default.GlobalWorkerOptions) {
    return lib.default;
  }
  return lib;
};

const PDFLib = getPdfLib();

// Configure the worker
if (PDFLib.GlobalWorkerOptions) {
  // Use unpkg for the worker script as it provides a reliable standalone script file
  // that works better with importScripts inside the worker than esm.sh sometimes does.
  PDFLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

export const convertPdfToImages = async (file: File): Promise<File[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document using the resolved library instance
    const loadingTask = PDFLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const imageFiles: File[] = [];
    const totalPages = pdf.numPages;

    // Iterate through all pages
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Set scale. 2.0 provides good resolution for OCR
      const scale = 2.0; 
      const viewport = page.getViewport({ scale });

      // Prepare canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Canvas context unavailable");
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      // Render PDF page to canvas
      await page.render(renderContext).promise;

      // Convert canvas to Blob/File
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const imageFile = new File(
              [blob], 
              `${file.name.replace(/\.pdf$/i, '')}_page_${pageNum}.jpg`, 
              { type: 'image/jpeg' }
            );
            imageFiles.push(imageFile);
            resolve();
          } else {
            reject(new Error(`PDF conversion failed for page ${pageNum}`));
          }
        }, 'image/jpeg', 0.95);
      });
    }

    return imageFiles;

  } catch (error) {
    console.error("Error converting PDF to images:", error);
    throw new Error("Failed to process PDF file. Please ensure it is a valid PDF.");
  }
};