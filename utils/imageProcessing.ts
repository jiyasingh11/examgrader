

// Sharpen Kernel (3x3) - High pass filter to enhance edges
const SHARPEN_KERNEL = [
  0, -1,  0,
 -1,  5, -1,
  0, -1,  0
];

// Helper to get pixel index
const getIdx = (x: number, y: number, width: number) => (y * width + x) * 4;

const applyConvolution = (data: Uint8ClampedArray | Float32Array, width: number, height: number, kernel: number[]) => {
  const output = new Float32Array(data.length);
  const side = Math.round(Math.sqrt(kernel.length));
  const halfSide = Math.floor(side / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < side; ky++) {
        for (let kx = 0; kx < side; kx++) {
          const cy = y + ky - halfSide;
          const cx = x + kx - halfSide;
          if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
            const idx = getIdx(cx, cy, width);
            const weight = kernel[ky * side + kx];
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }
      }
      const idx = getIdx(x, y, width);
      // Clamp values
      output[idx] = Math.min(255, Math.max(0, r));
      output[idx + 1] = Math.min(255, Math.max(0, g));
      output[idx + 2] = Math.min(255, Math.max(0, b));
      output[idx + 3] = data[idx + 3];
    }
  }
  return output;
};

// Median Filter for Noise Reduction (Salt and Pepper noise)
// Preserves edges better than Gaussian blur for text
const applyMedianFilter = (data: Uint8ClampedArray | Float32Array, width: number, height: number) => {
  const output = new Float32Array(data.length);
  const windowSize = 3; // 3x3 window
  const halfWindow = Math.floor(windowSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIdx(x, y, width);
      const rVals = [];
      const gVals = [];
      const bVals = [];

      for (let ky = -halfWindow; ky <= halfWindow; ky++) {
        for (let kx = -halfWindow; kx <= halfWindow; kx++) {
          const cy = y + ky;
          const cx = x + kx;
          if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
            const nIdx = getIdx(cx, cy, width);
            rVals.push(data[nIdx]);
            gVals.push(data[nIdx + 1]);
            bVals.push(data[nIdx + 2]);
          }
        }
      }

      rVals.sort((a, b) => a - b);
      gVals.sort((a, b) => a - b);
      bVals.sort((a, b) => a - b);

      const mid = Math.floor(rVals.length / 2);
      output[idx] = rVals[mid];
      output[idx + 1] = gVals[mid];
      output[idx + 2] = bVals[mid];
      output[idx + 3] = data[idx + 3];
    }
  }
  return output;
};

const applyGammaCorrection = (data: Uint8ClampedArray | Float32Array, gamma: number) => {
  const output = new Float32Array(data.length);
  const correctionFactor = 1 / gamma;

  for (let i = 0; i < data.length; i += 4) {
    output[i] = 255 * Math.pow(data[i] / 255, correctionFactor);
    output[i + 1] = 255 * Math.pow(data[i + 1] / 255, correctionFactor);
    output[i + 2] = 255 * Math.pow(data[i + 2] / 255, correctionFactor);
    output[i + 3] = data[i + 3];
  }
  return output;
};

// Histogram Equalization to maximize contrast
const applyHistogramEqualization = (data: Uint8ClampedArray | Float32Array) => {
  const output = new Float32Array(data.length);
  const histogram = new Uint32Array(256).fill(0);
  const cdf = new Uint32Array(256).fill(0);
  
  // 1. Calculate Histogram (Luminance)
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[Math.min(255, Math.max(0, lum))]++;
  }

  // 2. Calculate CDF
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += histogram[i];
    cdf[i] = sum;
  }

  // 3. Normalize & Map
  const totalPixels = data.length / 4;
  const cdfMin = cdf.find(val => val > 0) || 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    
    // Calculate new luminance
    const newLum = totalPixels === cdfMin 
      ? lum 
      : Math.round(((cdf[lum] - cdfMin) / (totalPixels - cdfMin)) * 255);
    
    // Output Grayscale for maximum text clarity
    output[i] = newLum;
    output[i + 1] = newLum;
    output[i + 2] = newLum;
    output[i + 3] = data[i + 3];
  }
  
  return output;
};

// Optimized Adaptive Thresholding using Integral Image (Summed Area Table)
// This is O(1) per pixel for mean calculation, regardless of window size.
const applyAdaptiveThreshold = (data: Float32Array | Uint8ClampedArray, width: number, height: number) => {
  const output = new Uint8ClampedArray(data.length);
  const w = width;
  const h = height;
  
  // 1. Convert to Grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  // 2. Compute Integral Image
  // S[y][x] = sum(gray[0..y][0..x])
  // Using Float64 to prevent overflow for large images
  const S = new Float64Array(w * h);
  
  for (let y = 0; y < h; y++) {
    let sumRow = 0;
    for (let x = 0; x < w; x++) {
      sumRow += gray[y * w + x];
      if (y === 0) {
        S[y * w + x] = sumRow;
      } else {
        S[y * w + x] = S[(y - 1) * w + x] + sumRow;
      }
    }
  }

  // Helper to get sum of a rectangle in O(1)
  const getSum = (x1: number, y1: number, x2: number, y2: number) => {
    // Clip coords
    const x0 = Math.max(0, x1);
    const y0 = Math.max(0, y1);
    const xMax = Math.min(w - 1, x2);
    const yMax = Math.min(h - 1, y2);
    
    // Sum = D - B - C + A
    const A = (x0 > 0 && y0 > 0) ? S[(y0 - 1) * w + (x0 - 1)] : 0;
    const B = (y0 > 0) ? S[(y0 - 1) * w + xMax] : 0;
    const C = (x0 > 0) ? S[yMax * w + (x0 - 1)] : 0;
    const D = S[yMax * w + xMax];
    
    return D - B - C + A;
  };

  // 3. Apply Threshold
  // Dynamic window size based on image width to handle high-res images appropriately
  const windowSize = Math.max(10, Math.floor(width / 40)); 
  const c = 8; // Constant subtracted from mean.

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x1 = x - windowSize;
      const y1 = y - windowSize;
      const x2 = x + windowSize;
      const y2 = y + windowSize;
      
      const count = (Math.min(w - 1, x2) - Math.max(0, x1) + 1) * (Math.min(h - 1, y2) - Math.max(0, y1) + 1);
      const sum = getSum(x1, y1, x2, y2);
      const mean = sum / count;
      
      const pixelVal = gray[y * w + x];
      const idx = (y * w + x) * 4;
      
      // If pixel is darker than local mean - c, it's ink (0). Otherwise paper (255).
      const val = pixelVal > (mean - c) ? 255 : 0;
      
      output[idx] = val;
      output[idx + 1] = val;
      output[idx + 2] = val;
      output[idx + 3] = 255;
    }
  }

  return output;
};

// Morphological Dilation (Max filter for white / Min filter for black)
const applyDilation = (data: Uint8ClampedArray, width: number, height: number) => {
  const output = new Uint8ClampedArray(data.length);
  const kernelSize = 1; 

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIdx(x, y, width);
      let minVal = 255; // Finding min value (blackest) to expand ink

      for (let ky = -kernelSize; ky <= kernelSize; ky++) {
        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
          const cy = y + ky;
          const cx = x + kx;
          if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
             const nIdx = getIdx(cx, cy, width);
             // Use Red channel as it's binarized (R=G=B)
             if (data[nIdx] < minVal) minVal = data[nIdx];
          }
        }
      }
      
      output[idx] = minVal;
      output[idx+1] = minVal;
      output[idx+2] = minVal;
      output[idx+3] = 255;
    }
  }
  return output;
};

// Morphological Erosion (Min filter for white / Max filter for black)
const applyErosion = (data: Uint8ClampedArray, width: number, height: number) => {
  const output = new Uint8ClampedArray(data.length);
  const kernelSize = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIdx(x, y, width);
      let maxVal = 0; // Finding max value (whitest) to shrink ink

      for (let ky = -kernelSize; ky <= kernelSize; ky++) {
        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
          const cy = y + ky;
          const cx = x + kx;
          if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
             const nIdx = getIdx(cx, cy, width);
             if (data[nIdx] > maxVal) maxVal = data[nIdx];
          }
        }
      }
      
      output[idx] = maxVal;
      output[idx+1] = maxVal;
      output[idx+2] = maxVal;
      output[idx+3] = 255;
    }
  }
  return output;
};

// Morphological Closing: Dilation followed by Erosion (Connects broken strokes)
const applyMorphologicalClosing = (data: Uint8ClampedArray, width: number, height: number) => {
  // 1. Dilate (Thicken black lines to close gaps)
  const eroded = applyDilation(data, width, height); 
  // 2. Erode (ciThining lines back to original width, leaving gaps closed)
  const closed = applyErosion(eroded, width, height); 
  
  return closed;
};

const calculateSkewAngle = (data: Uint8ClampedArray, width: number, height: number): number => {
  let bestVariance = 0;
  let bestAngle = 0;

  for (let angle = -5; angle <= 5; angle += 1) {
    if (angle === 0) continue;
    const radian = (angle * Math.PI) / 180;
    const projection = new Float32Array(height);
    
    for (let y = 0; y < height; y+=4) {
      for (let x = 0; x < width; x+=4) {
        const yRotated = Math.floor(x * Math.sin(radian) + y * Math.cos(radian));
        if (yRotated >= 0 && yRotated < height) {
           const idx = getIdx(x, y, width);
           if (data[idx] < 128) {
             projection[yRotated]++;
           }
        }
      }
    }

    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < height; i++) {
      sum += projection[i];
      sumSq += projection[i] * projection[i];
    }
    const variance = (sumSq / height) - (sum / height) ** 2;
    
    if (variance > bestVariance) {
      bestVariance = variance;
      bestAngle = angle;
    }
  }
  
  return bestAngle;
};

export const processImage = async (file: File): Promise<{ processedBase64: string, originalBase64: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      const scale = Math.min(1, MAX_WIDTH / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context missing");

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const originalBase64 = canvas.toDataURL(file.type).split(',')[1];
      
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;

      // --- Enhanced OCR Pipeline ---
      
      // 1. Gamma Correction: Normalize lighting and darken faint pencil strokes
      const gammaData = applyGammaCorrection(data, 0.8);
      
      // 2. Median Filter: Reduce salt-and-pepper noise
      const noiseReducedData = applyMedianFilter(gammaData, canvas.width, canvas.height);

      // 3. Histogram Equalization: Maximize global contrast (replaces simple contrast stretching)
      const equalizedData = applyHistogramEqualization(noiseReducedData);

      // 4. Sharpening: Enhance edges before thresholding
      const sharpenedData = applyConvolution(equalizedData, canvas.width, canvas.height, SHARPEN_KERNEL);

      // 5. Binarization: Adaptive Thresholding (Integral Image)
      const binarizedData = applyAdaptiveThreshold(sharpenedData, canvas.width, canvas.height);
      
      // 6. Morphological Closing: Connect broken strokes and fill small holes
      const closedData = applyMorphologicalClosing(binarizedData, canvas.width, canvas.height);

      const finalImageData = new ImageData(closedData, canvas.width, canvas.height);
      
      // 7. Deskewing: Correct text rotation
      const skewAngle = calculateSkewAngle(closedData, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      if (skewAngle !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((skewAngle * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx?.putImageData(finalImageData, 0, 0);
      
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();

      const processedBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      
      resolve({
        originalBase64,
        processedBase64
      });
    };
    
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
};
