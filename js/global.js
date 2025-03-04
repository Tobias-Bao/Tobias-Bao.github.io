// 全局变量

/**
 * 初始化主题切换
 */
function initThemeSwitch() {
    // 创建主题切换按钮
    const themeSwitch = document.createElement('div');
    themeSwitch.className = 'theme-switch';
    themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(themeSwitch);

    // 加载上次的主题设置
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // 事件监听器，切换主题
    themeSwitch.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // 切换主题图标
        if (isDarkMode) {
            themeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
}

/**
 * 加载FontAwesome
 */
function addFontAwesome() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);
}

/**
 * 添加涟漪效果
 */
function addRippleEffect() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/**
 * 初始化页面
 */
function initPage() {
    addFontAwesome();
    initThemeSwitch();
    addRippleEffect();
    
    // 添加页面加载动画
    document.querySelectorAll('.container > *').forEach((element, index) => {
        element.style.opacity = '0';
        element.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
    });
}

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', initPage);
