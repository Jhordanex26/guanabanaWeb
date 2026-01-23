// FRONTEND - app.js
// Lógica SPA + Mini Reproductor Avanzado

// ==========================================
// 1. CONFIGURACIÓN Y PLAYLIST
// ==========================================
const PLAYLIST = [
    { title: "I Wanna Be Yours", artist: "Arctic Monkeys", src: "img/wannaBe.mp3" },
    { title: "Smithereens", artist: "Twenty One Pilots", src: "img/smithereens.mp3" },
    { title: "Iris", artist: "The Goo Goo Dolls", src: "img/iris.mp3" },
    { title: "Eres", artist: "Eres", src: "img/eres.mp3" },
    { title: "Cena Romántica", artist: "Jazz Suave", src: "img/eliot.mp3" },
    { title: "Brindis", artist: "Sinfonía", src: "img/audio6.mp3" },
    { title: "Despedida", artist: "Acústico", src: "img/audio7.mp3" }
];

let globalAudio = new Audio();
let currentTrackIndex = 0;
let isPlayerExpanded = false;
let isMusicPlaying = false;
let isScrolling = false;
let scrollTimeout;

// ==========================================
// 2. INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Restaurar estado antes de iniciar
    const savedIndex = localStorage.getItem('currentTrackIndex');
    if (savedIndex !== null) currentTrackIndex = parseInt(savedIndex);

    // Configurar audio inicial pero no reproducir aun (esperar interacción)
    if (PLAYLIST[currentTrackIndex]) {
        globalAudio.src = PLAYLIST[currentTrackIndex].src;
    }

    setupPersistentPlayer();
    initPageScripts();
    enableSeamlessNavigation();
    setupScrollDetection();

    // Eventos de Audio Globales
    globalAudio.addEventListener('ended', nextTrack);
    globalAudio.addEventListener('timeupdate', updateProgressBar);
});

// ==========================================
// 3. SISTEMA DE REPRODUCTOR (UI & LOGIC)
// ==========================================

function setupPersistentPlayer() {
    // Si ya existe, no lo recreamos, solo actualizamos estado visual
    if (document.getElementById('mini-player-container')) {
        updatePlayerUI();
        return;
    }

    // Crear Estructura DOM del Reproductor
    const playerContainer = document.createElement('div');
    playerContainer.id = 'mini-player-container';
    playerContainer.className = 'fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2';

    playerContainer.innerHTML = `
        <div id="playlist-panel" class="hidden bg-black/80 backdrop-blur-md text-white p-4 rounded-xl w-64 shadow-2xl border border-white/10 mb-2 transform transition-all duration-300 origin-bottom-left scale-95 opacity-0">
            <h4 class="text-xs uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-700 pb-2">Playlist Boda</h4>
            <ul class="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-sm" id="playlist-ul">
                </ul>
        </div>

        <div id="mini-player" class="bg-gray-900/90 backdrop-blur-lg border border-white/10 text-white rounded-full p-2 pr-6 shadow-xl flex items-center gap-3 transition-all duration-300 hover:bg-gray-800 cursor-pointer group w-auto max-w-[90vw]">
            
            <div id="disk-cover" class="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-700 to-black border-2 border-gray-600 flex items-center justify-center relative overflow-hidden shadow-lg flex-shrink-0">
                 <img src="img/iconPerryAnime.jpg" class="w-full h-full object-cover opacity-80" alt="Cover">
                 <div class="absolute w-3 h-3 bg-gray-900 rounded-full border border-gray-500 z-10"></div>
            </div>

            <div class="flex flex-col flex-grow min-w-[100px] overflow-hidden" onclick="togglePlaylist()">
                <span id="track-title" class="text-xs font-bold truncate text-white leading-tight">Seleccione canción</span>
                <span id="track-artist" class="text-[10px] text-gray-400 truncate">Tocad para iniciar</span>
                <div class="w-full bg-gray-700 h-1 rounded-full mt-1 overflow-hidden">
                    <div id="progress-bar" class="bg-white h-full w-0 transition-all duration-200"></div>
                </div>
            </div>

            <div class="flex items-center gap-3 pl-2 border-l border-gray-700">
                <button onclick="prevTrack()" class="text-gray-400 hover:text-white transition"><i class="fa-solid fa-backward-step text-xs"></i></button>
                <button id="play-btn" onclick="togglePlay()" class="text-white hover:scale-110 transition"><i class="fa-solid fa-play"></i></button>
                <button onclick="nextTrack()" class="text-gray-400 hover:text-white transition"><i class="fa-solid fa-forward-step text-xs"></i></button>
            </div>
        </div>
    `;

    document.body.appendChild(playerContainer);
    renderPlaylistItems();

    // Restaurar estado visual
    const savedTime = localStorage.getItem('bgMusicTime');
    const savedState = localStorage.getItem('bgMusicPlaying');

    if (savedTime) globalAudio.currentTime = parseFloat(savedTime);

    if (savedState === 'true') {
        updatePlayerUI(true);
        // Intentar autoplay si estaba sonando
        attemptAutoPlay();
    } else {
        updatePlayerUI(false);
    }

    // Persistencia del tiempo
    setInterval(() => {
        if (!globalAudio.paused) localStorage.setItem('bgMusicTime', globalAudio.currentTime);
    }, 1000);
}

function renderPlaylistItems() {
    const ul = document.getElementById('playlist-ul');
    ul.innerHTML = '';
    PLAYLIST.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = `cursor-pointer p-2 rounded hover:bg-white/10 flex justify-between items-center transition ${index === currentTrackIndex ? 'bg-white/20 text-white font-bold' : 'text-gray-300'}`;
        li.innerHTML = `
            <div class="flex flex-col">
                <span>${song.title}</span>
                <span class="text-[9px] opacity-70">${song.artist}</span>
            </div>
            ${index === currentTrackIndex && !globalAudio.paused ? '<i class="fa-solid fa-volume-high text-xs animate-pulse"></i>' : ''}
        `;
        li.onclick = () => playTrack(index);
        ul.appendChild(li);
    });
}

function togglePlay(e) {
    if (e) e.stopPropagation();

    if (globalAudio.paused) {
        let playPromise = globalAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isMusicPlaying = true;
                localStorage.setItem('bgMusicPlaying', 'true');
                updatePlayerUI(true);
            }).catch(e => console.log("Interacción requerida"));
        }
    } else {
        globalAudio.pause();
        isMusicPlaying = false;
        localStorage.setItem('bgMusicPlaying', 'false');
        updatePlayerUI(false);
    }
}

function playTrack(index) {
    if (index < 0) index = PLAYLIST.length - 1;
    if (index >= PLAYLIST.length) index = 0;

    currentTrackIndex = index;
    localStorage.setItem('currentTrackIndex', index);

    globalAudio.src = PLAYLIST[currentTrackIndex].src;
    globalAudio.load();

    const playPromise = globalAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isMusicPlaying = true;
            localStorage.setItem('bgMusicPlaying', 'true');
            updatePlayerUI(true);
        });
    }
}

function nextTrack() {
    playTrack(currentTrackIndex + 1);
}

function prevTrack() {
    playTrack(currentTrackIndex - 1);
}

function togglePlaylist() {
    const panel = document.getElementById('playlist-panel');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        // Pequeño delay para permitir la transición CSS
        setTimeout(() => {
            panel.classList.remove('scale-95', 'opacity-0');
            panel.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            panel.classList.add('hidden');
        }, 300);
    }
}

function updatePlayerUI(isPlaying) {
    const disk = document.getElementById('disk-cover');
    const playBtn = document.getElementById('play-btn');
    const title = document.getElementById('track-title');
    const artist = document.getElementById('track-artist');

    // Actualizar Textos
    const currentSong = PLAYLIST[currentTrackIndex];
    if (title) title.innerText = currentSong.title;
    if (artist) artist.innerText = currentSong.artist;

    // Actualizar Estado Play/Pause
    if (isPlaying || !globalAudio.paused) {
        disk.classList.add('animate-spin-slow');
        disk.classList.remove('paused-animation');
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
        disk.classList.add('paused-animation'); // Pausa la animación donde esté
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }

    // Actualizar lista para mover el highlight
    renderPlaylistItems();
}

function updateProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (globalAudio.duration) {
        const percent = (globalAudio.currentTime / globalAudio.duration) * 100;
        if (bar) bar.style.width = `${percent}%`;
    }
}

function attemptAutoPlay() {
    globalAudio.play().then(() => {
        isMusicPlaying = true;
        updatePlayerUI(true);
    }).catch(() => {
        updatePlayerUI(false);
        // Fallback: Esperar click
        const unlock = () => {
            globalAudio.play();
            updatePlayerUI(true);
            document.removeEventListener('click', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
    });
}


// ==========================================
// 4. NAVEGACIÓN SPA (MODIFICADO PARA NO BORRAR PLAYER)
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
            loadPageContent(link.href);
        }
    });

    window.addEventListener('popstate', () => {
        loadPageContent(window.location.href, false);
    });
}

async function loadPageContent(url, pushState = true) {
    try {
        document.body.style.opacity = '0.5';

        const response = await fetch(url);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlText, 'text/html');

        // IMPORTANTE: Antes de reemplazar el body, guardamos referencia del player si existe
        // Aunque en esta implementación simple, como reemplazamos innerHTML del body,
        // el player se borra. Lo reconstruiremos inmediatamente.

        document.body.innerHTML = newDoc.body.innerHTML;
        document.body.className = newDoc.body.className;
        document.title = newDoc.title;

        // RECONSTRUIR EL PLAYER (El audio sigue en memoria en la variable globalAudio)
        setupPersistentPlayer();

        if (pushState) window.history.pushState({}, '', url);
        initPageScripts();

        document.body.style.opacity = '1';
        window.scrollTo(0, 0);

    } catch (error) {
        console.error('Error SPA:', error);
        window.location.href = url;
    }
}

// ==========================================
// 5. SCRIPTS ESPECÍFICOS DE PÁGINA (RESTO IGUAL)
// ==========================================
function setupScrollDetection() {
    window.addEventListener('scroll', () => {
        isScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => isScrolling = false, 150);
    }, { passive: true });
}

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
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);

            if (document.getElementById("days")) document.getElementById("days").innerText = String(d).padStart(2, '0');
            if (document.getElementById("hours")) document.getElementById("hours").innerText = String(h).padStart(2, '0');
            if (document.getElementById("minutes")) document.getElementById("minutes").innerText = String(m).padStart(2, '0');
            if (document.getElementById("seconds")) document.getElementById("seconds").innerText = String(s).padStart(2, '0');
        }, 1000);
    }

    // B. REVEAL SCROLL
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible', 'opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal-on-scroll').forEach(section => observer.observe(section));

    // C. OTRAS FUNCIONES (Fotos, Lightbox, etc)
    setupPhotoColorization();
    setupCameraButtonIndicator();

    // Lightbox events
    document.removeEventListener('keydown', handleEscKey);
    document.addEventListener('keydown', handleEscKey);
}

// ... (MANTENER EL RESTO DE TUS FUNCIONES: setupPhotoColorization, setupCameraButtonIndicator, Lightbox logic, CopyLogic)
// Copia aquí abajo las funciones setupPhotoColorization, setupCameraButtonIndicator, window.openLightbox, window.copiarAlPortapapeles, etc. del código original.
// No las he repetido para ahorrar espacio, pero son necesarias.

function setupPhotoColorization() {
    const photos = document.querySelectorAll('.polaroid-container img');
    const colorizeOnScroll = () => {
        photos.forEach(img => {
            const rect = img.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const distance = Math.abs(elementCenter - viewportCenter);
            const maxDistance = window.innerHeight / 2;
            const proximity = Math.max(0, 1 - (distance / maxDistance));
            const grayscale = Math.max(0, 1 - proximity);
            img.style.filter = `grayscale(${grayscale})`;
        });
    };
    window.addEventListener('scroll', colorizeOnScroll, { passive: true });
    colorizeOnScroll();
}

function setupCameraButtonIndicator() {
    const cameraBtn = document.querySelector('.floating-camera-btn');
    if (!cameraBtn) return;
    cameraBtn.classList.add('pulse-attention');
}

window.openLightbox = function (element) {
    if (isScrolling) return;
    const img = element.querySelector('img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (img && lightbox && lightboxImg) {
        if (img.src.includes('bg-gray-100')) return;
        lightboxImg.src = img.src;
        lightbox.classList.remove('hidden');
        setTimeout(() => lightboxImg.classList.add('scale-100'), 10);
        document.body.style.overflow = 'hidden';
    }
};

window.closeLightbox = function () {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightbox) {
        lightboxImg?.classList.remove('scale-100');
        setTimeout(() => lightbox.classList.add('hidden'), 200);
        document.body.style.overflow = '';
    }
};

function handleEscKey(event) { if (event.key === "Escape") window.closeLightbox(); }

// Funciones globales utilitarias (Mantener las de copiado y alertas de tu código original)
window.copiarAlPortapapeles = function (t, tipo, btn) { /* Tu lógica original aquí */
    navigator.clipboard.writeText(t).then(() => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: tipo + ' Copiado', timer: 2000, showConfirmButton: false }));
};
window.openQrModal = function () { document.getElementById('qrModal')?.classList.remove('hidden'); };
window.closeQrModal = function () { document.getElementById('qrModal')?.classList.add('hidden'); };
window.abrirSubidaFotos = function () { window.open('https://photos.app.goo.gl/Uf4z7rpbS9b9SdpU8', '_blank'); };