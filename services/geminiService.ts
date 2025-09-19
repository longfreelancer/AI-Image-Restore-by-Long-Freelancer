
import { GoogleGenAI, Modality } from "@google/genai";
import type { ConfigOptions } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const buildPrompt = (options: ConfigOptions): string => {
  const promptParts: string[] = [
    "You are a world-class digital restoration artist specializing in high-fidelity image enhancement. Your primary goal is 'conservative enhancement'. You must enhance this image with superior detail and sharpness while strictly preserving its original character, color, composition, and texture. Follow these instructions precisely:",
    "- IMPORTANT: Do NOT 'hallucinate' or invent details that are not present in the original. Do not change colors, textures, or the overall structure of the image. Your job is to make the existing details clearer and sharper, maintaining absolute fidelity to the source.",
  ];

  // Upscaling and Deblurring
  switch (options.mode) {
    case 'deblurOnly':
      promptParts.push("- Perform expert-level deblurring. Reveal hidden details lost to motion or focus issues, making the image crisp and clear at its original resolution. Preserve the original grain and texture.");
      break;
    case 'upscale2k':
      promptParts.push("- Upscale to 2K resolution (approx. 2048px). Focus on enhancing existing details with high fidelity. The result must be significantly clearer but compositionally identical to the original.");
      break;
    case 'upscale4k':
      promptParts.push("- Perform a high-fidelity upscale to a flawless 4K resolution (approx. 3840px). Meticulously enhance every micro-detail while preserving the original's texture and character. The result should feel hyper-detailed yet completely natural.");
      break;
    case 'upscale8k':
      promptParts.push("- Execute an expert-level 'super-resolution' to a massive 8K resolution (approx. 7680px). Your mission is to enhance existing microscopic details with absolute precision. Every single pixel must contribute to a breathtaking level of clarity and realism, without altering the original's artistic integrity.");
      break;
  }

  // Face Restoration
  if (options.faceRestore) {
    promptParts.push("- If human faces are present, apply a subtle, high-fidelity restoration. Enhance natural skin texture, individual hair strands, and eye clarity. The result must be photorealistic and true to the original, avoiding any artificial or 'plastic' look. Preserve the original facial structure and features.");
  } else {
    promptParts.push("- Do not apply any special processing to faces; enhance them with the same high-fidelity detail as the rest of the image.");
  }

  // Noise Reduction
  promptParts.push(`- Apply a ${options.noiseReduction} level of noise reduction. Carefully remove unwanted digital grain while preserving and enhancing the natural textures and micro-details of the image.`);

  // Detail Enhancement
  switch (options.detailEnhance) {
    case 'natural':
      promptParts.push("- Enhance details to a natural, photorealistic level. The image should look crisp but not artificially sharpened. Prioritize realism over digital sharpness.");
      break;
    case 'sharp':
      promptParts.push("- Enhance details to a sharp, high-definition level. Existing textures, edges, and patterns should be distinctly defined and clear, without introducing artifacts.");
      break;
    case 'ultra':
      promptParts.push("- Push the boundaries of clarity with 'ultra' detail enhancement. Every existing micro-detail should pop with extreme definition, creating a powerful, hyper-realistic effect that remains true to the source.");
      break;
  }
  
  promptParts.push("The final output must be a single, high-quality PNG image that is a direct enhancement of the provided input. Do not add any text, watermarks, or other artifacts. Your only output should be the beautifully restored image.");

  return promptParts.join(' ');
};


const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
};

const getCanvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Không thể tạo blob từ canvas."));
            }
        }, 'image/png');
    });
};

const processTile = async (
    tileFile: File,
    options: ConfigOptions,
    ai: GoogleGenAI
): Promise<HTMLImageElement> => {
    const imagePart = await fileToGenerativePart(tileFile);
    const prompt = buildPrompt(options);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return new Promise((resolve, reject) => {
                const enhancedTileImg = new Image();
                enhancedTileImg.onload = () => resolve(enhancedTileImg);
                enhancedTileImg.onerror = reject;
                enhancedTileImg.src = `data:image/png;base64,${part.inlineData.data}`;
            });
        }
    }
    throw new Error('API không trả về ảnh cho một phần.');
};

export const enhanceImage = async (
    imageFile: File,
    options: ConfigOptions,
    onProgress: (message: string) => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (options.mode === 'upscale4k' || options.mode === 'upscale8k') {
        onProgress("Đang chuẩn bị ảnh...");
        const originalImg = await createImageFromFile(imageFile);
        const { width: originalWidth, height: originalHeight } = originalImg;

        const TILE_OVERLAP = 64;
        
        const TARGET_TILE_SIZE = 512;
        const tilesX = Math.max(1, Math.ceil(originalWidth / TARGET_TILE_SIZE));
        const tilesY = Math.max(1, Math.ceil(originalHeight / TARGET_TILE_SIZE));

        const totalTiles = tilesX * tilesY;
        onProgress(`Chia ảnh thành ${totalTiles} phần...`);

        const tileCanvas = document.createElement('canvas');
        const tileCtx = tileCanvas.getContext('2d');
        if (!tileCtx) throw new Error("Không thể tạo context cho canvas.");

        const tileProcessingPromises = [];
        let completedCount = 0;
        
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const cellXStart = Math.floor(x * originalWidth / tilesX);
                const cellYStart = Math.floor(y * originalHeight / tilesY);
                const cellXEnd = Math.floor((x + 1) * originalWidth / tilesX);
                const cellYEnd = Math.floor((y + 1) * originalHeight / tilesY);
                
                const cellWidth = cellXEnd - cellXStart;
                const cellHeight = cellYEnd - cellYStart;

                const sx = Math.max(0, cellXStart - TILE_OVERLAP / 2);
                const sy = Math.max(0, cellYStart - TILE_OVERLAP / 2);
                const sWidth = Math.min(originalWidth - sx, cellWidth + TILE_OVERLAP);
                const sHeight = Math.min(originalHeight - sy, cellHeight + TILE_OVERLAP);

                tileCanvas.width = sWidth;
                tileCanvas.height = sHeight;
                tileCtx.clearRect(0, 0, sWidth, sHeight);
                tileCtx.drawImage(originalImg, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

                const tileBlob = await getCanvasBlob(tileCanvas);
                const tileFile = new File([tileBlob], `tile_${x}_${y}.png`, { type: 'image/png' });

                const promise = processTile(tileFile, options, ai).then(enhancedImg => {
                    completedCount++;
                    onProgress(`Đang xử lý phần ${completedCount} / ${totalTiles}...`);
                    return {
                        img: enhancedImg,
                        orig_sx: sx,
                        orig_sy: sy,
                        orig_sWidth: sWidth,
                        orig_sHeight: sHeight,
                    };
                });
                tileProcessingPromises.push(promise);
            }
        }
        
        const enhancedTiles = await Promise.all(tileProcessingPromises);
        
        onProgress("Đang ghép các phần ảnh lại...");

        let targetWidth, targetHeight;
        const aspectRatio = originalWidth / originalHeight;

        if (options.mode === 'upscale4k') {
            targetWidth = 3840;
            targetHeight = Math.round(targetWidth / aspectRatio);
        } else { // upscale8k
            targetWidth = 7680;
            targetHeight = Math.round(targetWidth / aspectRatio);
        }

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;
        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) throw new Error("Không thể tạo context cho canvas cuối cùng.");
        
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';

        const finalScaleX = targetWidth / originalWidth;
        const finalScaleY = targetHeight / originalHeight;

        // Stitch tiles together using a half-overlap method. This is more robust than
        // the previous core-cutting logic and avoids hard seams at tile boundaries
        // by placing the seam in the middle of the overlapped region.
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const tileIndex = y * tilesX + x;
                const tileData = enhancedTiles[tileIndex];
                if (!tileData || !tileData.img) continue;

                const { img: enhancedImg, orig_sWidth, orig_sHeight } = tileData;

                const tileScaleX = enhancedImg.width / orig_sWidth;
                const tileScaleY = enhancedImg.height / orig_sHeight;
                
                // Calculate the source rectangle from the enhanced tile image.
                // We trim half of the overlap from each side that has a neighbor.
                const halfOverlapX = (TILE_OVERLAP / 2) * tileScaleX;
                const halfOverlapY = (TILE_OVERLAP / 2) * tileScaleY;

                const sx = (x > 0) ? halfOverlapX : 0;
                const sy = (y > 0) ? halfOverlapY : 0;
                const sWidth = enhancedImg.width - sx - ((x < tilesX - 1) ? halfOverlapX : 0);
                const sHeight = enhancedImg.height - sy - ((y < tilesY - 1) ? halfOverlapY : 0);
                
                // Calculate the destination rectangle on the final canvas.
                // This corresponds to the region of the original image we are filling.
                const dx_orig = tileData.orig_sx + ((x > 0) ? TILE_OVERLAP / 2 : 0);
                const dy_orig = tileData.orig_sy + ((y > 0) ? TILE_OVERLAP / 2 : 0);

                const dWidth_orig = tileData.orig_sWidth - ((x > 0) ? TILE_OVERLAP / 2 : 0) - ((x < tilesX - 1) ? TILE_OVERLAP / 2 : 0);
                const dHeight_orig = tileData.orig_sHeight - ((y > 0) ? TILE_OVERLAP / 2 : 0) - ((y < tilesY - 1) ? TILE_OVERLAP / 2 : 0);

                const dx = Math.round(dx_orig * finalScaleX);
                const dy = Math.round(dy_orig * finalScaleY);
                const dWidth = Math.round(dWidth_orig * finalScaleX);
                const dHeight = Math.round(dHeight_orig * finalScaleY);

                if (sWidth > 0 && sHeight > 0 && dWidth > 0 && dHeight > 0) {
                    finalCtx.drawImage(
                        enhancedImg,
                        sx, sy,
                        sWidth, sHeight,
                        dx, dy,
                        dWidth, dHeight
                    );
                }
            }
        }

        return finalCanvas.toDataURL('image/png').split(',')[1];
    } else {
        onProgress("Đang xử lý ảnh...");
        const prompt = buildPrompt(options);
        const imagePart = await fileToGenerativePart(imageFile);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    imagePart,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        
        let fallbackText = '';
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            fallbackText += part.text + ' ';
          }
        }
        throw new Error(`API không trả về ảnh. Phản hồi: ${fallbackText.trim() || 'Không có phản hồi văn bản'}`);
    }
};
