// FRONTEND - app.js
// Lógica SPA para música continua + Funcionalidades de Boda

// ==========================================
// 1. CONFIGURACIÓN GLOBAL Y VARIABLES DE ESTADO
// ==========================================
const AUDIO_SRC = 'img/audioBodaGuanabana.mp3'; // Asegúrate que esta ruta sea correcta
let globalAudio = new Audio(AUDIO_SRC);
globalAudio.loop = true;
let isMusicPlaying = false;
let musicBtn = null; // Referencia al botón flotante

// ==========================================
// 2. INICIALIZACIÓN PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // A. Iniciar el sistema de música persistente
    setupPersistentMusic();

    // B. Iniciar scripts de la página actual (Animaciones, Countdown, etc.)
    initPageScripts();

    // C. Activar navegación sin recargas (SPA)
    enableSeamlessNavigation();
});

// ==========================================
// 3. SISTEMA DE MÚSICA PERSISTENTE
// ==========================================
function setupPersistentMusic() {
    // Crear el botón si no existe
    if (!document.querySelector('.music-control-btn')) {
        musicBtn = document.createElement('button');
        musicBtn.className = 'music-control-btn';
        musicBtn.innerHTML = '<i class="fa-solid fa-music"></i>';
        musicBtn.title = 'Música de fondo';
        musicBtn.style.zIndex = '9999';
        document.body.appendChild(musicBtn);

        // Evento Click Específico del Botón
        musicBtn.addEventListener('click', toggleMusic);
    } else {
        musicBtn = document.querySelector('.music-control-btn');
    }

    // Recuperar estado. Si es la primera vez (null), asumimos que queremos reproducir (true)
    const savedTime = localStorage.getItem('bgMusicTime');
    const savedState = localStorage.getItem('bgMusicPlaying');
    // Si no hay estado guardado (primera visita), intentamos reproducir
    const shouldPlay = savedState === null || savedState === 'true';

    if (savedTime) globalAudio.currentTime = parseFloat(savedTime);

    if (shouldPlay) {
        attemptAutoPlay();
    } else {
        updateMusicUI(false);
    }

    // Guardar progreso periódicamente
    setInterval(() => {
        if (isMusicPlaying) localStorage.setItem('bgMusicTime', globalAudio.currentTime);
    }, 1000);
}

// NUEVA FUNCIÓN: Intentar Autoplay y Fallback
function attemptAutoPlay() {
    const playPromise = globalAudio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Éxito: El navegador permitió el autoplay
            isMusicPlaying = true;
            localStorage.setItem('bgMusicPlaying', 'true');
            updateMusicUI(true);
        }).catch(error => {
            // Fallo: El navegador bloqueó el audio (Política de Autoplay)
            console.log("Autoplay bloqueado. Esperando primera interacción del usuario.");
            updateMusicUI(false);

            // ESTRATEGIA: Activar audio con el PRIMER clic en cualquier parte de la página
            const unlockAudio = () => {
                globalAudio.play().then(() => {
                    isMusicPlaying = true;
                    localStorage.setItem('bgMusicPlaying', 'true');
                    updateMusicUI(true);
                    // Limpiamos los listeners para que no se ejecuten más veces
                    document.removeEventListener('click', unlockAudio);
                    document.removeEventListener('touchstart', unlockAudio);
                    document.removeEventListener('keydown', unlockAudio);
                });
            };

            // Escuchamos cualquier interacción "fuerte"
            document.addEventListener('click', unlockAudio);
            document.addEventListener('touchstart', unlockAudio);
            document.addEventListener('keydown', unlockAudio);
        });
    }
}

function toggleMusic(e) {
    // Detenemos la propagación para que este click no se confunda con el "unlockAudio"
    if (e) e.stopPropagation();

    if (globalAudio.paused) {
        const playPromise = globalAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isMusicPlaying = true;
                localStorage.setItem('bgMusicPlaying', 'true');
                updateMusicUI(true);
            });
        }
    } else {
        globalAudio.pause();
        isMusicPlaying = false;
        localStorage.setItem('bgMusicPlaying', 'false');
        updateMusicUI(false);
    }
}

function updateMusicUI(isPlaying) {
    if (!musicBtn) return;

    if (isPlaying) {
        musicBtn.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin"></i>';
        musicBtn.classList.add('music-playing');
        musicBtn.style.boxShadow = "0 0 15px rgba(0,0,0,0.5)";
    } else {
        musicBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        musicBtn.classList.remove('music-playing');
        musicBtn.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.3)";
    }
}

// ==========================================
// 4. NAVEGACIÓN SPA (SIN RECARGAS)
// ==========================================
function enableSeamlessNavigation() {
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a');

        if (link &&
            link.href.startsWith(window.location.origin) &&
            !link.getAttribute('href').startsWith('#') &&
            !link.getAttribute('href').includes('javascript') &&
            link.target !== '_blank') {

            e.preventDefault();
            const url = link.href;
            loadPageContent(url);
        }
    });

    window.addEventListener('popstate', () => {
        loadPageContent(window.location.href, false);
    });
}

async function loadPageContent(url, pushState = true) {
    try {
        document.body.style.opacity = '0.5';
        document.body.style.transition = 'opacity 0.3s';

        const response = await fetch(url);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlText, 'text/html');
        const newBody = newDoc.body;

        // Mantener botón de música
        const currentMusicBtn = document.querySelector('.music-control-btn');
        if (currentMusicBtn) currentMusicBtn.remove();

        document.body.innerHTML = newBody.innerHTML;
        document.body.className = newBody.className;
        document.title = newDoc.title;

        // Reiniciar música (sin perder estado)
        setupPersistentMusic();

        if (pushState) window.history.pushState({}, '', url);

        initPageScripts();

        document.body.style.opacity = '1';
        window.scrollTo(0, 0);

    } catch (error) {
        console.error('Error cargando página:', error);
        window.location.href = url;
    }
}

// ==========================================
// 5. LÓGICA DE PÁGINA (SE EJECUTA EN CADA CAMBIO)
// ==========================================
function initPageScripts() {

    // A. CUENTA REGRESIVA
    const countdownContainer = document.getElementById("countdown");
    if (countdownContainer) {
        if (window.countdownInterval) clearInterval(window.countdownInterval);

        const weddingDate = new Date("February 23, 2026 00:00:00").getTime();
        window.countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = weddingDate - now;

            if (distance < 0) {
                clearInterval(window.countdownInterval);
                countdownContainer.innerHTML = "<div class='text-xl font-bold'>¡Es hoy!</div>";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (document.getElementById("days")) document.getElementById("days").innerText = String(days).padStart(2, '0');
            if (document.getElementById("hours")) document.getElementById("hours").innerText = String(hours).padStart(2, '0');
            if (document.getElementById("minutes")) document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
            if (document.getElementById("seconds")) document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');
        }, 1000);
    }

    // B. ANIMACIONES SCROLL
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible', 'opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal-on-scroll').forEach(section => observer.observe(section));

    // C. EVENTOS LIGHTBOX
    document.removeEventListener('keydown', handleEscKey);
    document.addEventListener('keydown', handleEscKey);
}

function handleEscKey(event) {
    if (event.key === "Escape") window.closeLightbox();
}

// ==========================================
// 6. FUNCIONES UTILITARIAS (GLOBALES)
// ==========================================

// COPIAR AL PORTAPAPELES
window.copiarAlPortapapeles = function (texto, tipo, btnElement) {
    const actualizarBoton = () => {
        if (btnElement) {
            const originalHTML = btnElement.innerHTML;
            const originalClasses = btnElement.className;
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> <span>¡Copiado!</span>';
            btnElement.classList.remove('bg-black', 'bg-purple-600', 'hover:bg-gray-800', 'hover:bg-purple-700');
            btnElement.classList.add('bg-green-600', 'hover:bg-green-700');
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.className = originalClasses;
            }, 2000);
        }
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(() => {
            actualizarBoton();
            window.mostrarAlerta(tipo);
        }).catch(() => window.copiarManual(texto, tipo, btnElement));
    } else {
        window.copiarManual(texto, tipo, btnElement);
    }
};

window.copiarManual = function (texto, tipo, btnElement) {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        if (btnElement) {
            const originalHTML = btnElement.innerHTML;
            const originalClasses = btnElement.className;
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> <span>¡Copiado!</span>';
            btnElement.classList.remove('bg-black', 'bg-purple-600');
            btnElement.classList.add('bg-green-600');
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.className = originalClasses;
            }, 2000);
        }
        window.mostrarAlerta(tipo);
    } catch (err) { }
    document.body.removeChild(textArea);
};

window.mostrarAlerta = function (tipo) {
    const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    Toast.fire({ icon: 'success', title: `${tipo} copiado` });
};

// MODALES QR & LIGHTBOX
window.openQrModal = function () {
    const modal = document.getElementById('qrModal');
    const backdrop = document.getElementById('modalBackdrop');
    const panel = document.getElementById('modalPanel');
    if (!modal) return;
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        backdrop?.classList.remove('opacity-0');
        panel?.classList.remove('scale-95', 'opacity-0');
        panel?.classList.add('scale-100', 'opacity-100');
    });
};
window.closeQrModal = function () {
    const modal = document.getElementById('qrModal');
    const backdrop = document.getElementById('modalBackdrop');
    const panel = document.getElementById('modalPanel');
    if (!modal) return;
    backdrop?.classList.add('opacity-0');
    panel?.classList.remove('scale-100', 'opacity-100');
    panel?.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
};

window.openLightbox = function (element) {
    const img = element.querySelector('img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (img && lightbox && lightboxImg) {
        if (img.src.includes('bg-gray-100')) return;
        lightboxImg.src = img.src;
        lightbox.classList.remove('hidden');
        lightbox.classList.add('active');
        setTimeout(() => {
            lightboxImg.classList.remove('scale-95');
            lightboxImg.classList.add('scale-100');
        }, 10);
        document.body.style.overflow = 'hidden';
    }
};
window.closeLightbox = function () {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightbox) {
        lightbox.classList.remove('active');
        if (lightboxImg) {
            lightboxImg.classList.remove('scale-100');
            lightboxImg.classList.add('scale-95');
        }
        document.body.style.overflow = '';
    }
};

window.abrirSubidaFotos = function () {
    Swal.fire({
        title: '¡Sé nuestro Paparazzi!', text: 'Sube aquí tus mejores capturas.', icon: 'camera',
        confirmButtonText: 'Subir Fotos', confirmButtonColor: '#000', showCancelButton: true, cancelButtonText: 'Cerrar'
    }).then((result) => {
        if (result.isConfirmed) window.open('https://photos.app.goo.gl/Uf4z7rpbS9b9SdpU8', '_blank');
    });
};