document.addEventListener('DOMContentLoaded', () => {
    const qrText = document.getElementById('qr-text');
    const qrcodeContainer = document.getElementById('qrcode');
    const downloadBtn = document.getElementById('download-btn');

    let qrcode = null;

    function generateQRCode() {
        const text = qrText.value.trim();

        // 清空之前的二维码
        qrcodeContainer.innerHTML = '';

        if (text) {
            // 创建新的QRCode实例
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
            // 如果没有输入，显示一个占位符
            qrcodeContainer.innerHTML = '<div class="w-64 h-64 bg-gray-200 flex items-center justify-center text-gray-400 text-center p-4 rounded-md">请在上方输入内容以生成二维码</div>';
            downloadBtn.disabled = true;
            downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    // 下载二维码
    downloadBtn.addEventListener('click', () => {
        if (!qrcode) return;

        // 获取由库生成的 canvas 元素
        const canvas = qrcodeContainer.getElementsByTagName('canvas')[0];
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'qrcode.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    // 监听输入
    qrText.addEventListener('input', generateQRCode);

    // 页面加载时生成一次
    generateQRCode();
});
