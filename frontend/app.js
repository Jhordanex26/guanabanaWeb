// FRONTEND - app.js
// Lógica SPA + Mini Reproductor Avanzado + Aleatorio + Autoplay Inteligente

// ==========================================
// 1. CONFIGURACIÓN Y PLAYLIST
// ==========================================
const PLAYLIST = [
    { title: "I Wanna Be Yours", artist: "Arctic Monkeys", src: "img/wannaBe.mp3" },
    { title: "Smithereens", artist: "Twenty One Pilots", src: "img/smithereens.mp3" },
    { title: "Iris", artist: "The Goo Goo Dolls", src: "img/iris.mp3" },
    { title: "Eres", artist: "Café Tacvba", src: "img/eres.mp3" },
    { title: "Can't Take My Eyes off You.mp3", artist: "Frankie Valli", src: "img/eyes.mp3" },
    { title: "Until I Found You.mp3", artist: "Stephen Sanchez ", src: "img/untill.mp3" },
    { title: "I Think They Call This Love", artist: "Eliot James", src: "img/eliot.mp3" }
];

let globalAudio = new Audio();
let currentTrackIndex = 0;
let isMusicPlaying = false;
let isScrolling = false;
let scrollTimeout;

// ==========================================
// 2. INICIALIZACIÓN (MODIFICADO PARA ALEATORIO)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // 1. LÓGICA ALEATORIA SIEMPRE:
    // Generamos un número aleatorio entre 0 y el total de canciones
    currentTrackIndex = Math.floor(Math.random() * PLAYLIST.length);

    // Forzamos que empiece desde el segundo 0
    globalAudio.src = PLAYLIST[currentTrackIndex].src;
    globalAudio.currentTime = 0;

    // Limpiamos el localStorage antiguo para que no interfiera
    localStorage.removeItem('bgMusicTime');
    localStorage.setItem('currentTrackIndex', currentTrackIndex);

    setupPersistentPlayer();
    initPageScripts();
    enableSeamlessNavigation();
    setupScrollDetection();

    // Eventos de Audio Globales
    globalAudio.addEventListener('ended', nextTrack); // Al terminar, pasa a la siguiente
    globalAudio.addEventListener('timeupdate', updateProgressBar);
});

// ==========================================
// 3. SISTEMA DE REPRODUCTOR (UI & LOGIC)
// ==========================================

// ==========================================
// 3. SISTEMA DE REPRODUCTOR (UI & LOGIC) - MEJORADO
// ==========================================

function setupPersistentPlayer() {
    // Si ya existe, actualizamos UI y salimos
    if (document.getElementById('mini-player-container')) {
        updatePlayerUI(isMusicPlaying);
        return;
    }

    // Crear Estructura DOM
    const playerContainer = document.createElement('div');
    playerContainer.id = 'mini-player-container';
    // Agregamos 'player-hidden-start' para que empiece invisible y abajo
    playerContainer.className = 'fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 player-hidden-start transition-all duration-1000 ease-out';

    playerContainer.innerHTML = `
        <div id="playlist-panel" class="hidden bg-black/80 backdrop-blur-md text-white p-4 rounded-xl w-64 shadow-2xl border border-white/10 mb-2 transform transition-all duration-300 origin-bottom-left scale-95 opacity-0">
            <h4 class="text-xs uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-700 pb-2">Playlist Boda</h4>
            <ul class="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-sm" id="playlist-ul"></ul>
        </div>

        <div id="mini-player" class="bg-gray-900/90 backdrop-blur-lg border border-white/10 text-white rounded-full p-2 shadow-xl flex items-center shadow-[0_0_15px_rgba(0,0,0,0.5)] h-16" >
            
            <div id="disk-cover" onclick="togglePlayerSize()" class="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-700 to-black border-2 border-gray-600 flex items-center justify-center relative overflow-hidden shadow-lg flex-shrink-0 cursor-pointer hover:scale-105 transition-transform z-20">
                 <img src="img/iconPerryAnime.jpg" class="w-full h-full object-cover opacity-80" alt="Cover">
                 <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                    <i class="fa-solid fa-music text-[10px] text-white/70"></i>
                 </div>
            </div>

            <div id="player-controls-wrapper" class="flex items-center player-content-hidden transition-all duration-500 delay-100 overflow-hidden whitespace-nowrap">
                
                <div class="flex flex-col min-w-[100px] mr-4 cursor-pointer" onclick="togglePlaylist()">
                    <span id="track-title" class="text-xs font-bold truncate text-white leading-tight max-w-[120px]">Cargando...</span>
                    <span id="track-artist" class="text-[10px] text-gray-400 truncate max-w-[120px]">Música de fondo</span>
                    <div class="w-full bg-gray-700 h-1 rounded-full mt-1 overflow-hidden">
                        <div id="progress-bar" class="bg-white h-full w-0 transition-all duration-200"></div>
                    </div>
                </div>

                <div class="flex items-center gap-3 pl-3 border-l border-gray-700">
                    <button onclick="prevTrack()" class="text-gray-400 hover:text-white transition p-1"><i class="fa-solid fa-backward-step text-xs"></i></button>
                    <button id="play-btn" onclick="togglePlay()" class="text-white hover:scale-110 transition bg-white/10 rounded-full w-8 h-8 flex items-center justify-center"><i class="fa-solid fa-play text-xs"></i></button>
                    <button onclick="nextTrack()" class="text-gray-400 hover:text-white transition p-1"><i class="fa-solid fa-forward-step text-xs"></i></button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(playerContainer);
    renderPlaylistItems();

    // EFECTO DE ENTRADA: Esperamos 1 segundo y lo hacemos aparecer
    setTimeout(() => {
        playerContainer.classList.remove('player-hidden-start');
        playerContainer.classList.add('player-visible-start');
    }, 1000);

    // Intentar reproducir (Autoplay logic)
    attemptAutoPlay();
}

// NUEVA FUNCIÓN PARA ABRIR/CERRAR EL REPRODUCTOR
function togglePlayerSize() {
    const player = document.getElementById('mini-player');
    const content = document.getElementById('player-controls-wrapper');
    const playlist = document.getElementById('playlist-panel');

    // Si la playlist está abierta y cerramos el player, cerramos la playlist también
    if (player.classList.contains('expanded') && !playlist.classList.contains('hidden')) {
        togglePlaylist(); // Cerrar playlist
    }

    player.classList.toggle('expanded');

    if (player.classList.contains('expanded')) {
        // ABRIR
        content.classList.remove('player-content-hidden');
        content.classList.add('player-content-visible');
    } else {
        // CERRAR
        content.classList.remove('player-content-visible');
        content.classList.add('player-content-hidden');
    }
}

// ... [MANTENER LA FUNCIÓN renderPlaylistItems IGUAL] ...
function renderPlaylistItems() {
    const ul = document.getElementById('playlist-ul');
    if (!ul) return;
    ul.innerHTML = '';
    PLAYLIST.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = `cursor-pointer p-2 rounded hover:bg-white/10 flex justify-between items-center transition ${index === currentTrackIndex ? 'bg-white/20 text-white font-bold' : 'text-gray-300'}`;
        li.innerHTML = `
            <div class="flex flex-col">
                <span>${song.title}</span>
                <span class="text-[9px] opacity-70">${song.artist}</span>
            </div>
            ${index === currentTrackIndex && isMusicPlaying ? '<i class="fa-solid fa-volume-high text-xs animate-pulse"></i>' : ''}
        `;
        li.onclick = () => playTrack(index);
        ul.appendChild(li);
    });
}

// ... [MANTENER LAS FUNCIONES togglePlay, playTrack, nextTrack, prevTrack, togglePlaylist IGUALES] ...
function togglePlay(e) {
    if (e) e.stopPropagation();
    if (globalAudio.paused) {
        globalAudio.play().then(() => {
            isMusicPlaying = true;
            updatePlayerUI(true);
        });
    } else {
        globalAudio.pause();
        isMusicPlaying = false;
        updatePlayerUI(false);
    }
}

function playTrack(index) {
    if (index < 0) index = PLAYLIST.length - 1;
    if (index >= PLAYLIST.length) index = 0;
    currentTrackIndex = index;
    globalAudio.src = PLAYLIST[currentTrackIndex].src;
    globalAudio.load();
    globalAudio.play().then(() => {
        isMusicPlaying = true;
        updatePlayerUI(true);
    }).catch(e => console.log("Esperando interacción..."));
}

function nextTrack() { playTrack(currentTrackIndex + 1); }
function prevTrack() { playTrack(currentTrackIndex - 1); }

function togglePlaylist() {
    const panel = document.getElementById('playlist-panel');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        setTimeout(() => { panel.classList.remove('scale-95', 'opacity-0'); panel.classList.add('scale-100', 'opacity-100'); }, 10);
    } else {
        panel.classList.remove('scale-100', 'opacity-100'); panel.classList.add('scale-95', 'opacity-0');
        setTimeout(() => { panel.classList.add('hidden'); }, 300);
    }
}

function updatePlayerUI(isPlaying) {
    const disk = document.getElementById('disk-cover');
    const playBtn = document.getElementById('play-btn');
    const title = document.getElementById('track-title');
    const artist = document.getElementById('track-artist');

    const currentSong = PLAYLIST[currentTrackIndex];
    if (title) title.innerText = currentSong.title;
    if (artist) artist.innerText = currentSong.artist;

    if (isPlaying && !globalAudio.paused) {
        disk?.classList.add('animate-spin-slow');
        disk?.classList.remove('paused-animation');
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
        disk?.classList.add('paused-animation');
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    renderPlaylistItems();
}

function updateProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (globalAudio.duration && bar) {
        const percent = (globalAudio.currentTime / globalAudio.duration) * 100;
        bar.style.width = `${percent}%`;
    }
}

// ==========================================
// 4. AUTOPLAY INTELIGENTE (LA CLAVE DE TU PREGUNTA)
// ==========================================
function attemptAutoPlay() {
    // Intentamos reproducir directamente (funciona si el usuario ya interactuó antes con el dominio)
    const playPromise = globalAudio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // ÉXITO: El navegador permitió el autoplay
            isMusicPlaying = true;
            updatePlayerUI(true);
        }).catch(error => {
            // BLOQUEADO: El navegador bloqueó el autoplay
            console.log("Autoplay bloqueado por el navegador. Activando 'Trampa de Primer Click'.");
            updatePlayerUI(false);

            // TRAMPA MAESTRA:
            // Escuchamos el PRIMER click, scroll o toque en CUALQUIER parte de la página
            const unlockAudio = () => {
                globalAudio.play().then(() => {
                    isMusicPlaying = true;
                    updatePlayerUI(true);

                    // Una vez activado, quitamos los "oídos" para no consumir recursos
                    document.removeEventListener('click', unlockAudio);
                    document.removeEventListener('touchstart', unlockAudio);
                    document.removeEventListener('scroll', unlockAudio);
                    document.removeEventListener('keydown', unlockAudio);
                });
            };

            // Ponemos los "sensores" en todo el documento
            document.addEventListener('click', unlockAudio, { once: true });
            document.addEventListener('touchstart', unlockAudio, { once: true });
            document.addEventListener('scroll', unlockAudio, { once: true });
            document.addEventListener('keydown', unlockAudio, { once: true });
        });
    }
}


// ==========================================
// 5. NAVEGACIÓN SPA (MODIFICADO)
// ==========================================
// ... [MANTENER EL RESTO DEL CÓDIGO DE SPA IGUAL] ...
function enableSeamlessNavigation() {
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link && link.href.startsWith(window.location.origin) && !link.getAttribute('href').startsWith('#') && !link.getAttribute('href').includes('javascript') && link.target !== '_blank') {
            e.preventDefault();
            loadPageContent(link.href);
        }
    });
    window.addEventListener('popstate', () => { loadPageContent(window.location.href, false); });
}

async function loadPageContent(url, pushState = true) {
    try {
        document.body.style.opacity = '0.5';
        const response = await fetch(url);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlText, 'text/html');

        document.body.innerHTML = newDoc.body.innerHTML;
        document.body.className = newDoc.body.className;
        document.title = newDoc.title;

        // AL CAMBIAR DE PÁGINA, NO REINICIAMOS LA MÚSICA
        // Simplemente reconstruimos el reproductor visual
        setupPersistentPlayer();

        if (pushState) window.history.pushState({}, '', url);
        initPageScripts();
        document.body.style.opacity = '1';
        window.scrollTo(0, 0);
    } catch (error) { window.location.href = url; }
}

// ... [COPIA AQUÍ LAS FUNCIONES initPageScripts, setupScrollDetection, setupPhotoColorization, etc.] ...
// (Asegúrate de pegar el resto de funciones auxiliares que tenías en el código anterior: initPageScripts, setupScrollDetection, colorize, lightbox, etc.)
function setupScrollDetection() {
    window.addEventListener('scroll', () => {
        isScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => isScrolling = false, 150);
    }, { passive: true });
}

function initPageScripts() {
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
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible', 'opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal-on-scroll').forEach(section => observer.observe(section));

    setupPhotoColorization();
    setupCameraButtonIndicator();
    document.removeEventListener('keydown', handleEscKey);
    document.addEventListener('keydown', handleEscKey);
}

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
window.copiarAlPortapapeles = function (t, tipo, btn) {
    navigator.clipboard.writeText(t).then(() => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: tipo + ' Copiado', timer: 2000, showConfirmButton: false }));
};
window.openQrModal = function () { document.getElementById('qrModal')?.classList.remove('hidden'); };
window.closeQrModal = function () { document.getElementById('qrModal')?.classList.add('hidden'); };
window.abrirSubidaFotos = function () { window.open('https://photos.app.goo.gl/Uf4z7rpbS9b9SdpU8', '_blank'); };