document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const container = document.getElementById('signature-container');
    const canvas = document.getElementById('signature-canvas');
    const tip = document.getElementById('signature-tip');
    const clearButton = document.getElementById('clear-button');
    const downloadBtn = document.getElementById('download-btn');
    const penColorInput = document.getElementById('pen-color');

    // Mode Buttons
    const modeManualBtn = document.getElementById('mode-manual');
    const modeAutoBtn = document.getElementById('mode-auto');

    // Manual-specific controls
    const manualSettings = document.getElementById('manual-settings');
    const penWidthInput = document.getElementById('pen-width');
    const penWidthDisplay = document.getElementById('pen-width-display');

    // Auto-specific controls
    const autoSettings = document.getElementById('auto-settings');
    const nameInput = document.getElementById('name-input');
    const fontFamilySelect = document.getElementById('font-family');
    const fontWeightInput = document.getElementById('font-weight');
    const fontWeightContainer = document.getElementById('font-weight-container');
    const weightDisplay = document.getElementById('weight-display');

    // Modal Elements
    const imagePreviewModal = document.getElementById('image-preview-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const modalContent = imagePreviewModal.querySelector('.modal-content');

    const ctx = canvas.getContext('2d');

    // State
    let mode = 'manual'; // 'manual' or 'auto'
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let hasContent = false;

    // --- Utility Functions ---

    function resizeCanvas() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr); // Scale context for high-res displays
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Re-render content after resizing
        if (mode === 'auto') {
            renderAutoSignature();
        } else {
            // Context is reset on resize, so re-apply settings
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            updateManualContext();
            setHasContent(false); // Drawing is cleared
            tip.style.opacity = '1';
        }
    }


    function updateManualContext() {
        ctx.strokeStyle = penColorInput.value;
        const penWidth = parseInt(penWidthInput.value, 10);
        ctx.lineWidth = penWidth; // Directly use value, scaling is handled by DPR
        penWidthDisplay.textContent = penWidth;
    }

    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        // Return coordinates relative to the canvas element
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        return { x, y };
    }

    function setHasContent(state) {
        hasContent = state;
        downloadBtn.disabled = !state;
        if (state) {
            container.classList.add(mode === 'manual' ? 'drawing' : 'has-text');
        } else {
            container.classList.remove('drawing', 'has-text');
        }
    }

    // --- Drawing Logic (Manual Mode) ---

    function drawStart(e) {
        if (mode !== 'manual') return;
        e.preventDefault();
        isDrawing = true;
        const coords = getCoords(e);
        [lastX, lastY] = [coords.x, coords.y];
        ctx.beginPath(); // Start a new path
        ctx.moveTo(lastX, lastY);
        setHasContent(true);
    }

    function draw(e) {
        if (!isDrawing || mode !== 'manual') return;
        e.preventDefault();
        const coords = getCoords(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke(); // Draw the line
        [lastX, lastY] = [coords.x, coords.y];
    }

    function drawEnd() {
        if (mode !== 'manual') return;
        isDrawing = false;
        ctx.closePath();
    }

    // --- Text Rendering (Auto Mode) ---

    function handleFontFamilyChange() {
        const selectedOption = fontFamilySelect.options[fontFamilySelect.selectedIndex];
        const isVariable = selectedOption.dataset.variable === 'true';

        if (isVariable) {
            fontWeightInput.disabled = false;
            fontWeightContainer.classList.remove('disabled');
        } else {
            // For non-variable fonts, reset to 400 and disable the slider
            fontWeightInput.value = 400;
            weightDisplay.textContent = '400';
            fontWeightInput.disabled = true;
            fontWeightContainer.classList.add('disabled');
        }
        renderAutoSignature();
    }


    function renderAutoSignature() {
        const render = async () => {
            const text = nameInput.value;
            const fontFamily = fontFamilySelect.value;
            const fontWeight = fontWeightInput.value;
            const color = penColorInput.value;
            // Use a generic font string for loading check
            const fontToLoad = `${fontWeight} 12px "${fontFamily}"`;

            try {
                // Check if font is loaded before attempting to load again
                if (!document.fonts.check(fontToLoad, text)) {
                    await document.fonts.load(fontToLoad, text);
                }
            } catch (error) {
                console.error(`Font loading failed for "${fontFamily}":`, error);
            }

            const dpr = window.devicePixelRatio || 1;
            const canvasWidth = canvas.width / dpr;
            const canvasHeight = canvas.height / dpr;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            if (!text.trim()) {
                setHasContent(false);
                tip.style.opacity = '1';
                return;
            }

            tip.style.opacity = '0';
            setHasContent(true);

            const padding = 40;
            let fontSize = 150; // Initial font size

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            // Dynamically adjust font size to fit canvas
            let finalFont;
            do {
                fontSize -= 1;
                finalFont = `${fontWeight} ${fontSize}px "${fontFamily}"`;
                ctx.font = finalFont;
            } while (ctx.measureText(text).width > canvasWidth - padding && fontSize > 10);

            ctx.fillStyle = color;
            ctx.font = finalFont;
            ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
        };
        render();
    }


    // --- Controls and Download ---

    function clearCanvas() {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        if (mode === 'auto') {
            nameInput.value = '';
            renderAutoSignature(); // Re-render to show placeholder text
        }
        tip.style.opacity = '1';
        setHasContent(false);
    }

    function saveSignature() {
        if (!hasContent) return;
        const dataURL = canvas.toDataURL('image/png');
        const filename = `signature-${new Date().getTime()}.png`;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isTouchDevice) {
            showImageInModal(dataURL);
        } else {
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // --- Mode Switching ---

    function switchMode(newMode) {
        if (mode === newMode) return;
        mode = newMode;

        if (mode === 'manual') {
            modeManualBtn.classList.add('active');
            modeAutoBtn.classList.remove('active');
            manualSettings.classList.remove('hidden');
            autoSettings.classList.add('hidden');
            tip.textContent = '在此区域签名...';
            container.style.cursor = 'crosshair';
        } else { // auto mode
            modeAutoBtn.classList.add('active');
            modeManualBtn.classList.remove('active');
            autoSettings.classList.remove('hidden');
            manualSettings.classList.add('hidden');
            tip.textContent = '签名将在此预览...';
            container.style.cursor = 'default';
            handleFontFamilyChange(); // Initial check for font properties
        }
        clearCanvas();
    }

    // --- Modal Functions ---

    function showImageInModal(dataURL) {
        imagePreviewContainer.innerHTML = `<img src="${dataURL}" class="w-full h-auto rounded-md shadow-inner bg-white">`;
        imagePreviewModal.classList.remove('hidden');
        setTimeout(() => {
            imagePreviewModal.classList.add('opacity-100');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function hideImageModal() {
        imagePreviewModal.classList.remove('opacity-100');
        modalContent.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => imagePreviewModal.classList.add('hidden'), 300);
    }


    // --- Event Listeners and Initialization ---

    canvas.addEventListener('mousedown', drawStart);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', drawEnd);
    canvas.addEventListener('mouseout', drawEnd);
    canvas.addEventListener('touchstart', drawStart, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', drawEnd);

    clearButton.addEventListener('click', clearCanvas);
    downloadBtn.addEventListener('click', saveSignature);
    penColorInput.addEventListener('input', () => {
        if (mode === 'manual') updateManualContext();
        else renderAutoSignature();
    });

    penWidthInput.addEventListener('input', updateManualContext);

    nameInput.addEventListener('input', renderAutoSignature);
    fontFamilySelect.addEventListener('change', handleFontFamilyChange);
    fontWeightInput.addEventListener('input', (e) => {
        weightDisplay.textContent = e.target.value;
        renderAutoSignature();
    });

    modeManualBtn.addEventListener('click', () => switchMode('manual'));
    modeAutoBtn.addEventListener('click', () => switchMode('auto'));

    window.addEventListener('resize', resizeCanvas);
    closeModalBtn.addEventListener('click', hideImageModal);
    imagePreviewModal.addEventListener('click', (e) => e.target === imagePreviewModal && hideImageModal());

    // Initial Setup
    document.fonts.ready.then(() => {
        switchMode('manual');
        resizeCanvas();
    });
});

