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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

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
    
    // ... (rest of your functions go here) ...
    
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
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = smallWidth;
        tempCanvas.height = smallHeight;
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.drawImage(originalImage, 0, 0, smallWidth, smallHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(tempCanvas, 0, 0, width, height);
        const palette = palettes[selectedPalette];
        if (palette && palette.length > 0) {
            applyPalette(palette);
        }
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
        if (!palette?.length) return [r, g, b];
        let minDistance = Infinity;
        let nearestColor = palette[0];
        for (const color of palette) {
            const distance = Math.pow(r - color[0], 2) + Math.pow(g - color[1], 2) + Math.pow(b - color[2], 2);
            if (distance < minDistance) {
                minDistance = distance;
                nearestColor = color;
            }
        }
        return nearestColor;
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
    const imageUrl = canvas.toDataURL("image/png");
    window.open(imageUrl);
    status.textContent = `Image opened in new tab • ${paletteNames[selectedPalette]}`;
});
});
