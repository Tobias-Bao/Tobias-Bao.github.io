document.addEventListener('DOMContentLoaded', () => {
    const qrText = document.getElementById('qr-text');
    const qrcodeContainer = document.getElementById('qrcode');
    const downloadBtn = document.getElementById('download-btn');
    const imagePreviewModal = document.getElementById('image-preview-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const modalContent = imagePreviewModal.querySelector('div');

    let finalCanvas = null;

    function generateQRCode() {
        const text = qrText.value;
        qrcodeContainer.innerHTML = '';
        finalCanvas = null;

        if (text) {
            try {
                // 1. Create the QR Code data model.
                // Type 0 means the library will auto-detect the smallest necessary QR version.
                const qr = qrcode(0, 'H');
                qr.addData(text);
                qr.make();

                // 2. Define the final image parameters for high resolution and consistent border.
                const finalSize = 512; // High resolution for saving
                const border = 24;    // The desired pixel width for the white border on each side

                // 3. Get the actual module count from the library (e.g., 21x21, 25x25).
                const moduleCount = qr.getModuleCount();

                // 4. Calculate the perfect integer size for each module to fit without blurring.
                const contentAreaSize = finalSize - (border * 2);
                const moduleSize = Math.floor(contentAreaSize / moduleCount);

                if (moduleSize === 0) {
                    throw new Error("Content is too long to be rendered crisply.");
                }

                // 5. Calculate the total size of the QR code content area.
                const finalQrContentSize = moduleSize * moduleCount;

                // 6. Create the final canvas that will be displayed and downloaded.
                finalCanvas = document.createElement('canvas');
                finalCanvas.width = finalSize;
                finalCanvas.height = finalSize;
                const ctx = finalCanvas.getContext('2d');

                // 7. Fill the canvas with a white background, which forms our consistent border.
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, finalSize, finalSize);

                // 8. Calculate the offset to perfectly center the QR code within the border.
                const offset = (finalSize - finalQrContentSize) / 2;

                // 9. Manually draw the QR code, module by module, for a pixel-perfect, crisp image.
                for (let row = 0; row < moduleCount; row++) {
                    for (let col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(
                                offset + col * moduleSize,
                                offset + row * moduleSize,
                                moduleSize,
                                moduleSize
                            );
                        }
                    }
                }

                // 10. Display the final canvas. CSS will handle scaling it for the view.
                qrcodeContainer.appendChild(finalCanvas);

                downloadBtn.disabled = false;
                downloadBtn.classList.remove('opacity-50', 'cursor-not-allowed');

            } catch (error) {
                console.error("QR Code generation failed:", error);
                qrcodeContainer.innerHTML = `<div class="w-full h-full bg-red-100 flex items-center justify-center text-red-500 text-center p-4 rounded-md">二维码生成失败，内容可能过长。</div>`;
                downloadBtn.disabled = true;
                downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        } else {
            qrcodeContainer.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-center p-4 rounded-md">请在上方输入内容以生成二维码</div>';
            downloadBtn.disabled = true;
            downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    function showImageInModal(canvas) {
        imagePreviewContainer.innerHTML = ''; // Clear previous image
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.className = 'w-full h-auto rounded-md shadow-inner';
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

    downloadBtn.addEventListener('click', () => {
        if (!finalCanvas) return;

        const filename = 'qrcode.png';
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isTouchDevice) {
            showImageInModal(finalCanvas);
        } else {
            const link = document.createElement('a');
            link.href = finalCanvas.toDataURL('image/png');
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    qrText.addEventListener('input', generateQRCode);
    closeModalBtn.addEventListener('click', hideImageModal);
    imagePreviewModal.addEventListener('click', (e) => {
        if (e.target === imagePreviewModal) {
            hideImageModal();
        }
    });

    generateQRCode();
});

