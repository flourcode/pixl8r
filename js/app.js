document.addEventListener('DOMContentLoaded', function() {

    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const changeImage = document.getElementById('changeImage');
    const pixelSize = document.getElementById('pixelSize');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const status = document.getElementById('status');
    const canvas = document.getElementById('canvas');
    const imageInfo = document.getElementById('imageInfo');
    const ctx = canvas.getContext('2d');

    let originalImage = null;
    let selectedPalette = 'gameboy';

    const palettes = {
        natural: [],
        gameboy: [[15,56,15], [48,98,48], [139,172,15], [155,188,15]],
        pico8: [
            [0,0,0], [29,43,83], [126,37,83], [0,135,81], [171,82,54], [95,87,79], [194,195,199],
            [255,241,232], [255,0,77], [255,163,0], [255,236,39], [0,228,54], [41,173,255], 
            [131,118,156], [255,119,168], [255,204,170]
        ],
        sweetie16: [
            [26,28,44], [93,39,93], [177,62,83], [239,125,87], [255,205,117], [167,240,112], 
            [56,183,100], [37,113,121], [41,54,111], [59,93,201], [65,166,246], [115,239,247],
            [244,244,244], [148,176,194], [86,108,134], [51,60,87]
        ],
        c64: [
            [0,0,0], [255,255,255], [136,57,50], [103,182,189], [139,63,150], [85,160,73],
            [64,49,141], [191,206,114], [139,84,41], [87,66,0], [184,105,98], [80,80,80],
            [120,120,120], [148,224,137], [120,105,196], [159,159,159]
        ],
        nes: [
            [124,124,124], [0,0,252], [0,0,188], [68,40,188], [148,0,132], [168,0,32],
            [168,16,0], [136,20,0], [80,48,0], [0,120,0], [0,104,0], [0,88,0],
            [0,64,88], [0,0,0], [188,188,188], [0,120,248], [0,88,248], [104,68,252],
            [216,0,204], [228,0,88], [248,56,0], [228,92,16], [172,124,0], [0,184,0],
            [0,168,0], [0,168,68], [0,136,136], [248,248,248], [60,188,252], [104,136,252],
            [152,120,248], [248,120,248], [248,88,152], [248,120,88], [252,160,68], [248,184,0],
            [184,248,24], [88,216,84], [88,248,152], [0,232,216], [120,120,120], [252,252,252]
        ],
        cga: [
            [0,0,0], [0,0,170], [0,170,0], [0,170,170], [170,0,0], [170,0,170],
            [170,85,0], [170,170,170], [85,85,85], [85,85,255], [85,255,85], [85,255,255],
            [255,85,85], [255,85,255], [255,255,85], [255,255,255]
        ],
        mono: [[0,0,0], [255,255,255]],
        sepia: [
            [112,66,20], [140,85,31], [168,107,46], [196,129,61], [224,151,76],
            [252,173,91], [255,196,115], [255,218,139], [255,240,163], [255,255,187]
        ]
    };

    const paletteNames = {
        natural: 'NATURAL',
        gameboy: 'GAME BOY',
        pico8: 'PICO-8',
        sweetie16: 'SWEETIE-16',
        c64: 'C64',
        nes: 'NES',
        cga: 'CGA',
        mono: 'MONO',
        sepia: 'SEPIA'
    };
    
    function getImageBackgroundColor() {
        if (!canvas.width || !canvas.height) return null;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const colorCounts = {};
        const sampleSize = 10;
        const edgePixels = [];
        for (let x = 0; x < canvas.width; x += sampleSize) {
            edgePixels.push([x, 0]);
            edgePixels.push([x, canvas.height - 1]);
        }
        for (let y = 0; y < canvas.height; y += sampleSize) {
            edgePixels.push([0, y]);
            edgePixels.push([canvas.width - 1, y]);
        }
        edgePixels.forEach(([x, y]) => {
            const index = (y * canvas.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const colorKey = `${r},${g},${b}`;
            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        });
        let maxCount = 0;
        let dominantColor = null;
        for (const [colorKey, count] of Object.entries(colorCounts)) {
            if (count > maxCount) {
                maxCount = count;
                const [r, g, b] = colorKey.split(',').map(Number);
                dominantColor = `rgb(${r}, ${g}, ${b})`;
            }
        }
        return dominantColor;
    }

    function selectPalette(key) {
        selectedPalette = key;
        if (originalImage) {
            processImage();
            if (selectedPalette === 'natural') {
                const bgColor = getImageBackgroundColor();
                if (bgColor) {
                    document.querySelector('.screen').style.backgroundColor = bgColor;
                } else {
                    document.querySelector('.screen').style.backgroundColor = '#f0f0f0';
                }
            } else {
                const bgColor = getImageBackgroundColor();
                if (bgColor) {
                    document.querySelector('.screen').style.backgroundColor = bgColor;
                } else {
                    document.querySelector('.screen').style.backgroundColor = '#9bbc0f';
                }
            }
        } else {
            if (selectedPalette === 'natural') {
                document.querySelector('.screen').style.backgroundColor = '#f0f0f0';
            } else {
                document.querySelector('.screen').style.backgroundColor = '#9bbc0f';
            }
        }
        updateStatus();
    }

    function updateStatus() {
        const paletteName = paletteNames[selectedPalette];
        const baseStatus = status.textContent.split(' • ')[0];
        status.textContent = `${baseStatus} • ${paletteName}`;
    }

    document.querySelector('.dpad').addEventListener('click', function(e) {
        e.preventDefault();
        const paletteKeys = Object.keys(palettes);
        const currentIndex = paletteKeys.indexOf(selectedPalette);
        const nextIndex = (currentIndex + 1) % paletteKeys.length;
        selectPalette(paletteKeys[nextIndex]);
    });

    document.addEventListener('keydown', function(e) {
        const paletteKeys = Object.keys(palettes);
        const currentIndex = paletteKeys.indexOf(selectedPalette);
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % paletteKeys.length;
            selectPalette(paletteKeys[nextIndex]);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + paletteKeys.length) % paletteKeys.length;
            selectPalette(paletteKeys[prevIndex]);
        }
    });

    uploadZone.addEventListener('click', () => fileInput.click());
    changeImage.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    });

    let dragCounter = 0;
    uploadZone.addEventListener('dragenter', function(e) {
        e.preventDefault();
        dragCounter++;
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragover', (e) => e.preventDefault());

    uploadZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            uploadZone.classList.remove('dragover');
            dragCounter = 0;
        }
    });

    uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dragCounter = 0;
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            status.textContent = 'Invalid File Type';
            return;
        }
        status.textContent = 'Loading...';
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                originalImage = img;
                selectedPalette = 'gameboy';
                uploadZone.classList.add('has-image');
                imageInfo.textContent = `${img.width}×${img.height}`;
                processImage();
                resetBtn.disabled = false;
                downloadBtn.disabled = false;
                status.textContent = 'Cartridge Loaded';
                updateStatus();
            };
            img.onerror = () => status.textContent = 'Failed to Load Image';
            img.src = e.target.result;
        };
        reader.onerror = () => status.textContent = 'File Read Error';
        reader.readAsDataURL(file);
    }

    pixelSize.addEventListener('input', () => {
        if (originalImage) processImage();
    });

    // Enhanced processImage function
    function processImage() {
        if (!originalImage) return;
        
        const maxSize = 600;
        let width = originalImage.width;
        let height = originalImage.height;
        
        if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const pixelSizeValue = parseInt(pixelSize.value);
        const smallWidth = Math.max(1, Math.floor(width / pixelSizeValue));
        const smallHeight = Math.max(1, Math.floor(height / pixelSizeValue));
        
        // Create temporary canvas for downsampling
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = smallWidth;
        tempCanvas.height = smallHeight;
        
        // Step 1: Pre-process with color smoothing for better grouping
        const processedCanvas = document.createElement('canvas');
        const processedCtx = processedCanvas.getContext('2d');
        processedCanvas.width = width;
        processedCanvas.height = height;
        processedCtx.drawImage(originalImage, 0, 0, width, height);
        
        // Apply color smoothing before pixelation
        applyColorSmoothing(processedCtx, width, height);
        
        // Step 2: Downsample with better sampling
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(processedCanvas, 0, 0, smallWidth, smallHeight);
        
        // Step 3: Apply palette before upsampling for cleaner results
        const palette = palettes[selectedPalette];
        if (palette && palette.length > 0) {
            applyPaletteToCanvas(tempCtx, smallWidth, smallHeight, palette);
        }
        
        // Step 4: Upsample back to full size
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(tempCanvas, 0, 0, width, height);
        
        // Step 5: Final contrast enhancement
        enhanceContrast(ctx, width, height);
        
        // Background color handling
        if (selectedPalette === 'natural') {
            const bgColor = getImageBackgroundColor();
            if (bgColor) {
                document.querySelector('.screen').style.backgroundColor = bgColor;
            } else {
                document.querySelector('.screen').style.backgroundColor = '#f0f0f0';
            }
        } else {
            const bgColor = getImageBackgroundColor();
            if (bgColor) {
                document.querySelector('.screen').style.backgroundColor = bgColor;
            }
        }
        
        status.textContent = `${pixelSizeValue}px Pixels • ${paletteNames[selectedPalette]}`;
    }

    // Color smoothing to group similar colors before pixelation
    function applyColorSmoothing(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const newData = new Uint8ClampedArray(data);
        
        // Simple bilateral-like filter
        const radius = 2;
        for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
                const centerIdx = (y * width + x) * 4;
                let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
                
                // Sample surrounding pixels
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const sampleIdx = ((y + dy) * width + (x + dx)) * 4;
                        
                        // Color similarity weight
                        const colorDiff = Math.abs(data[centerIdx] - data[sampleIdx]) +
                                        Math.abs(data[centerIdx + 1] - data[sampleIdx + 1]) +
                                        Math.abs(data[centerIdx + 2] - data[sampleIdx + 2]);
                        
                        const weight = Math.exp(-colorDiff / 50) * Math.exp(-(dx*dx + dy*dy) / 8);
                        
                        totalR += data[sampleIdx] * weight;
                        totalG += data[sampleIdx + 1] * weight;
                        totalB += data[sampleIdx + 2] * weight;
                        totalWeight += weight;
                    }
                }
                
                if (totalWeight > 0) {
                    newData[centerIdx] = Math.round(totalR / totalWeight);
                    newData[centerIdx + 1] = Math.round(totalG / totalWeight);
                    newData[centerIdx + 2] = Math.round(totalB / totalWeight);
                }
            }
        }
        
        ctx.putImageData(new ImageData(newData, width, height), 0, 0);
    }

    // Apply palette to small canvas before upsampling
    function applyPaletteToCanvas(ctx, width, height, paletteColors) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = findNearestColorLAB(data[i], data[i + 1], data[i + 2], paletteColors);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Better color matching using LAB color space
    function findNearestColorLAB(r, g, b, palette) {
        if (!palette?.length) return [r, g, b];
        
        const [l1, a1, b1] = rgbToLab(r, g, b);
        let minDistance = Infinity;
        let nearestColor = palette[0];
        
        for (const color of palette) {
            const [l2, a2, b2] = rgbToLab(color[0], color[1], color[2]);
            const distance = Math.sqrt(Math.pow(l2 - l1, 2) + Math.pow(a2 - a1, 2) + Math.pow(b2 - b1, 2));
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestColor = color;
            }
        }
        
        return nearestColor;
    }

    // RGB to LAB color space conversion (simplified)
    function rgbToLab(r, g, b) {
        // Normalize RGB
        r /= 255;
        g /= 255;
        b /= 255;
        
        // Convert to XYZ
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        
        const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
        
        // Convert to LAB
        const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
        const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
        const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
        
        const l = 116 * fy - 16;
        const a = 500 * (fx - fy);
        const bLab = 200 * (fy - fz);
        
        return [l, a, bLab];
    }

    // Enhance contrast for sharper pixel art look
    function enhanceContrast(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Calculate histogram
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            histogram[gray]++;
        }
        
        // Find 2nd and 98th percentiles
        const totalPixels = width * height;
        let cumulative = 0;
        let min = 0, max = 255;
        
        for (let i = 0; i < 256; i++) {
            cumulative += histogram[i];
            if (cumulative > totalPixels * 0.02 && min === 0) min = i;
            if (cumulative > totalPixels * 0.98 && max === 255) {
                max = i;
                break;
            }
        }
        
        // Apply contrast stretch
        const range = max - min;
        if (range > 0) {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, ((data[i] - min) * 255) / range));
                data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - min) * 255) / range));
                data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - min) * 255) / range));
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Legacy function for compatibility
    function applyPalette(paletteColors) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = findNearestColor(data[i], data[i + 1], data[i + 2], paletteColors);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function findNearestColor(r, g, b, palette) {
        return findNearestColorLAB(r, g, b, palette);
    }

    resetBtn.addEventListener('click', function() {
        if (!originalImage) return;
        const maxSize = 600;
        let width = originalImage.width;
        let height = originalImage.height;
        if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(originalImage, 0, 0, width, height);
        status.textContent = `Reset to Original • ${paletteNames[selectedPalette]}`;
    });

    downloadBtn.addEventListener('click', function() {
        const link = document.createElement('a');
        link.download = 'pixel-art.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        status.textContent = `Image Saved • ${paletteNames[selectedPalette]}`;
    });

});
