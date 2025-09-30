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
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        if (mode === 'auto') {
            renderAutoSignature();
        } else {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            updateManualContext();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    function updateManualContext() {
        ctx.strokeStyle = penColorInput.value;
        const penWidth = parseInt(penWidthInput.value, 10);
        ctx.lineWidth = penWidth * 2;
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
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
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
        setHasContent(true);
    }

    function draw(e) {
        if (!isDrawing || mode !== 'manual') return;
        e.preventDefault();
        const coords = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        [lastX, lastY] = [coords.x, coords.y];
    }

    function drawEnd() {
        if (mode !== 'manual') return;
        isDrawing = false;
        ctx.closePath();
    }

    // --- Text Rendering (Auto Mode) ---

    function renderAutoSignature() {
        // Use an async inner function to handle font loading
        const render = async () => {
            const text = nameInput.value;
            const fontFamily = fontFamilySelect.value;
            const fontWeight = fontWeightInput.value;
            const color = penColorInput.value;
            // A font string with a default size for the loader
            const fontToLoad = `${fontWeight} 12px "${fontFamily}"`;

            // Await for the font to be loaded by the browser.
            try {
                await document.fonts.load(fontToLoad, text);
            } catch (error) {
                console.error(`Error loading font: ${error}`);
            }

            // Clear canvas after font is ready
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!text.trim()) {
                setHasContent(false);
                tip.style.opacity = '1';
                return;
            }

            tip.style.opacity = '0';
            setHasContent(true);

            const padding = 40 * 2; // High-res padding
            let fontSize = 150 * 2; // Start with a large font size

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            // Auto-fit font size
            let finalFont;
            do {
                fontSize -= 2;
                finalFont = `${fontWeight} ${fontSize}px "${fontFamily}"`;
                ctx.font = finalFont;
            } while (ctx.measureText(text).width > canvas.width - padding && fontSize > 10);

            // Set final properties and draw the text
            ctx.fillStyle = color;
            ctx.font = finalFont;
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        };

        render(); // Execute the async rendering function
    }


    // --- Controls and Download ---

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (mode === 'auto') {
            nameInput.value = '';
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
        mode = newMode;
        clearCanvas();

        if (mode === 'manual') {
            modeManualBtn.classList.add('active');
            modeAutoBtn.classList.remove('active');
            manualSettings.classList.remove('hidden');
            autoSettings.classList.add('hidden');
            tip.textContent = '在此区域签名...';
            container.style.cursor = 'crosshair';
            updateManualContext();
        } else { // auto mode
            modeAutoBtn.classList.add('active');
            modeManualBtn.classList.remove('active');
            autoSettings.classList.remove('hidden');
            manualSettings.classList.add('hidden');
            tip.textContent = '签名将在此预览...';
            container.style.cursor = 'default';
            renderAutoSignature();
        }
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

    // Drawing Listeners
    canvas.addEventListener('mousedown', drawStart);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', drawEnd);
    canvas.addEventListener('mouseout', drawEnd);
    canvas.addEventListener('touchstart', drawStart, {
        passive: false
    });
    canvas.addEventListener('touchmove', draw, {
        passive: false
    });
    canvas.addEventListener('touchend', drawEnd);

    // Control Listeners
    clearButton.addEventListener('click', clearCanvas);
    downloadBtn.addEventListener('click', saveSignature);
    penColorInput.addEventListener('input', () => {
        if (mode === 'manual') updateManualContext();
        else renderAutoSignature();
    });

    // Manual-specific listeners
    penWidthInput.addEventListener('input', updateManualContext);

    // Auto-specific listeners
    nameInput.addEventListener('input', renderAutoSignature);
    fontFamilySelect.addEventListener('change', renderAutoSignature);
    fontWeightInput.addEventListener('input', (e) => {
        weightDisplay.textContent = e.target.value;
        renderAutoSignature();
    });

    // Mode switch listeners
    modeManualBtn.addEventListener('click', () => switchMode('manual'));
    modeAutoBtn.addEventListener('click', () => switchMode('auto'));

    // Window and Modal
    window.addEventListener('resize', resizeCanvas);
    closeModalBtn.addEventListener('click', hideImageModal);
    imagePreviewModal.addEventListener('click', (e) => e.target === imagePreviewModal && hideImageModal());

    // Initial Setup
    // Ensure fonts are ready before initial render
    document.fonts.ready.then(() => {
        switchMode('manual');
        resizeCanvas();
    });
});

