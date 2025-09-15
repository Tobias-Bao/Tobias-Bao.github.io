document.addEventListener('DOMContentLoaded', () => {
    const qrText = document.getElementById('qr-text');
    const qrcodeContainer = document.getElementById('qrcode');
    const downloadBtn = document.getElementById('download-btn');
    const imagePreviewModal = document.getElementById('image-preview-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const modalContent = imagePreviewModal.querySelector('div');

    let qrcode = null;

    function generateQRCode() {
        const text = qrText.value.trim();

        qrcodeContainer.innerHTML = '';

        if (text) {
            qrcode = new QRCode(qrcodeContainer, {
                text: text,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('opacity-50', 'cursor-not-allowed');

        } else {
            qrcodeContainer.innerHTML = '<div class="w-64 h-64 bg-gray-200 flex items-center justify-center text-gray-400 text-center p-4 rounded-md">请在上方输入内容以生成二维码</div>';
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
        if (!qrcode) return;
        const canvas = qrcodeContainer.getElementsByTagName('canvas')[0];
        if (!canvas) return;

        const filename = 'qrcode.png';
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // For touch devices, show the modal for long-press saving.
        if (isTouchDevice) {
            showImageInModal(canvas);
        } else {
            // For desktops, trigger a direct download.
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
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
