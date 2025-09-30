document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const container = document.getElementById('signature-container');
    const canvas = document.getElementById('signature-canvas');
    const tip = document.getElementById('signature-tip');
    const clearButton = document.getElementById('clear-button');
    const downloadBtn = document.getElementById('download-btn');
    const penColorInput = document.getElementById('pen-color');
    const penWidthInput = document.getElementById('pen-width');
    const widthDisplay = document.getElementById('width-display');

    // Modal Elements (reused from QR code generator)
    const imagePreviewModal = document.getElementById('image-preview-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const modalContent = imagePreviewModal.querySelector('.modal-content');

    const ctx = canvas.getContext('2d');

    // State
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let signatureDrawn = false; // Flag to check if any drawing has occurred

    // --- Utility Functions ---

    /**
     * Initializes or resizes the canvas to match its container size.
     * Crucially sets high resolution and ensures background is transparent (default for canvas).
     */
    function resizeCanvas() {
        // Get the size of the container element
        const rect = container.getBoundingClientRect();

        // Set the internal canvas dimensions (high resolution for crisp lines)
        // Note: setting width/height resets the canvas state
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;

        // Set the display size via CSS (handled by the HTML/CSS) or set below
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        // Restore context settings after resize
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColorInput.value;
        ctx.lineWidth = parseInt(penWidthInput.value, 10) * 2; // Scale line width for high resolution

        // Ensure initial background is transparent (cleared to transparent)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Updates the context settings based on user input.
     */
    function updateContext() {
        ctx.strokeStyle = penColorInput.value;
        ctx.lineWidth = parseInt(penWidthInput.value, 10) * 2; // Scale line width
        widthDisplay.textContent = penWidthInput.value;
    }

    /**
     * Gets the coordinates of the pointer (mouse or touch) relative to the canvas.
     */
    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            // Touch event
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            // Mouse event
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculate coordinates relative to canvas, accounting for scaling factor (2)
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        return { x, y };
    }

    // --- Drawing Logic ---

    /**
     * Starts the drawing path.
     */
    function drawStart(e) {
        // Prevent default touch behavior (like scrolling)
        if (e.type.startsWith('touch')) e.preventDefault();

        isDrawing = true;
        container.classList.add('drawing');

        const coords = getCoords(e);
        [lastX, lastY] = [coords.x, coords.y];

        signatureDrawn = true;
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    /**
     * Draws the line segment.
     */
    function draw(e) {
        if (!isDrawing) return;
        if (e.type.startsWith('touch')) e.preventDefault();

        const coords = getCoords(e);
        const newX = coords.x;
        const newY = coords.y;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(newX, newY);
        ctx.stroke();

        [lastX, lastY] = [newX, newY];
    }

    /**
     * Stops the drawing path.
     */
    function drawEnd() {
        isDrawing = false;
        ctx.closePath();
    }

    // --- Controls and Download ---

    /**
     * Clears the entire canvas.
     */
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        container.classList.remove('drawing');
        signatureDrawn = false;
        downloadBtn.disabled = true;
        downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    /**
     * Handles the download process, ensuring transparent PNG is used.
     */
    function saveSignature() {
        if (!signatureDrawn) return;

        // Use PNG format, which supports transparency, and the scaled-up canvas data.
        const dataURL = canvas.toDataURL('image/png');
        const filename = `electronic-signature-${new Date().getTime()}.png`;

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isTouchDevice) {
            showImageInModal(dataURL);
        } else {
            // For desktop: trigger a direct download
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // --- Modal Functions (for mobile saving) ---

    function showImageInModal(dataURL) {
        imagePreviewContainer.innerHTML = ''; // Clear previous image
        const img = document.createElement('img');
        img.src = dataURL;
        // Setting a light checkerboard background to visualize transparency on the modal
        img.className = 'w-full h-auto rounded-md shadow-inner bg-checkerboard';
        imagePreviewContainer.appendChild(img);

        imagePreviewModal.classList.remove('hidden');
        setTimeout(() => {
            imagePreviewModal.classList.add('opacity-100');
            modalContent.classList.add('scale-100', 'opacity-100');
            modalContent.classList.remove('scale-95', 'opacity-0');
        }, 10);
    }

    function hideImageModal() {
        imagePreviewModal.classList.remove('opacity-100');
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            imagePreviewModal.classList.add('hidden');
        }, 300);
    }


    // --- Event Listeners and Initialization ---

    // Drawing Events (Mouse)
    canvas.addEventListener('mousedown', drawStart);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', drawEnd);
    canvas.addEventListener('mouseout', drawEnd); // Stop drawing if mouse leaves canvas

    // Drawing Events (Touch)
    canvas.addEventListener('touchstart', drawStart, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', drawEnd);
    canvas.addEventListener('touchcancel', drawEnd);

    // Controls
    clearButton.addEventListener('click', clearCanvas);
    downloadBtn.addEventListener('click', saveSignature);
    penColorInput.addEventListener('input', updateContext);
    penWidthInput.addEventListener('input', updateContext);

    // Initial setup and resizing
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    updateContext(); // Apply initial width/color settings

    // Modal close events
    closeModalBtn.addEventListener('click', hideImageModal);
    imagePreviewModal.addEventListener('click', (e) => {
        if (e.target === imagePreviewModal) {
            hideImageModal();
        }
    });
});
