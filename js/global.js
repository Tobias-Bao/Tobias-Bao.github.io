// Globale Funktionen und Variablen

/**
 * Initialisiert den Dunkelmodus-Schalter
 */
function initThemeSwitch() {
    // Erstellt den Dunkelmodus-Schalter
    const themeSwitch = document.createElement('div');
    themeSwitch.className = 'theme-switch';
    themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(themeSwitch);

    // Lädt den gespeicherten Modus
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Event-Listener für den Dunkelmodus-Schalter
    themeSwitch.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // Ändert das Icon basierend auf dem Modus
        if (isDarkMode) {
            themeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
}

/**
 * Fügt Font Awesome für Icons hinzu
 */
function addFontAwesome() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);
}

/**
 * Fügt Ripple-Effekt zu Buttons hinzu
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
 * Initialisiert die Seite
 */
function initPage() {
    addFontAwesome();
    initThemeSwitch();
    addRippleEffect();
    
    // Fügt Fade-In-Animation zu allen Elementen hinzu
    document.querySelectorAll('.container > *').forEach((element, index) => {
        element.style.opacity = '0';
        element.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
    });
}

// Initialisiert die Seite, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initPage);
