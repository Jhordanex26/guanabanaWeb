// FRONTEND - app.js
// Solo lógica de interfaz de usuario y eventos del DOM

document.addEventListener('DOMContentLoaded', () => {

    // 1. CUENTA REGRESIVA
    const weddingDate = new Date("February 23, 2026 00:00:00").getTime();

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        const container = document.getElementById("countdown");
        if (!container) return;

        if (distance < 0) {
            clearInterval(timer);
            container.innerHTML = "<div class='text-xl font-bold'>¡Es hoy!</div>";
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

    // 2. INTERSECTION OBSERVER (Animaciones)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal-on-scroll').forEach(section => observer.observe(section));

    // 3. ENVÍO DE FORMULARIO (Solo frontend - envía datos al backend)
    const rsvpForm = document.getElementById('rsvpForm');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = document.getElementById('submitBtn');
            const originalBtnText = btn.innerHTML;

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

            try {
                const response = await fetch('/api/asistencia', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (!response.ok) throw new Error(result.message || 'Error en el servidor');

                Swal.fire({
                    title: '¡Confirmado!',
                    text: 'Gracias por acompañarnos. Tu asistencia ha sido registrada.',
                    icon: 'success',
                    confirmButtonColor: '#000',
                    confirmButtonText: 'Cerrar'
                });

                this.reset();

            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error de Conexión',
                    text: 'No pudimos conectar con el servidor.',
                    icon: 'error',
                    confirmButtonColor: '#000'
                });
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalBtnText;
            }
        });
    }
});


// 4. BOTÓN COPIAR
function copiarAlPortapapeles(texto, tipo, btnElement) {

    // Función interna para actualizar el botón (La lógica que pediste)
    const actualizarBoton = () => {
        if (btnElement) {
            const originalHTML = btnElement.innerHTML;
            const originalClasses = btnElement.className; // Guardar clases originales

            // Cambiar a estado "Éxito"
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> <span>¡Copiado!</span>';

            // Quitar colores específicos y poner verde (Tailwind)
            btnElement.classList.remove('bg-black', 'bg-purple-600', 'hover:bg-gray-800', 'hover:bg-purple-700');
            btnElement.classList.add('bg-green-600', 'hover:bg-green-700');

            // Restaurar después de 2 segundos
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.className = originalClasses; // Restaura colores originales
            }, 2000);
        }
    };

    // Intento moderno de copiar
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(() => {
            actualizarBoton();
            mostrarAlerta(tipo);
        }).catch(err => {
            console.error('Error al copiar', err);
            copiarManual(texto, tipo, btnElement); // Intento fallback
        });
    } else {
        copiarManual(texto, tipo, btnElement);
    }
}

function copiarManual(texto, tipo, btnElement) {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        // Si funciona el fallback, también actualizamos el botón
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
        mostrarAlerta(tipo);
    } catch (err) {
        console.error('Fallback error', err);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'No se pudo copiar automáticamente. Por favor selecciónalo manualmente.',
            confirmButtonColor: '#000'
        });
    }
    document.body.removeChild(textArea);
}

function mostrarAlerta(tipo) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: 'success',
        title: `${tipo} copiado`
    });
}
window.openQrModal = function () {
    const modal = document.getElementById('qrModal');
    const backdrop = document.getElementById('modalBackdrop');
    const panel = document.getElementById('modalPanel');

    if (!modal || !backdrop || !panel) return;

    modal.classList.remove('hidden');

    // Usamos un pequeño timeout para permitir que el navegador renderice el display:block antes de cambiar opacidades
    requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    });
};

window.closeQrModal = function () {
    const modal = document.getElementById('qrModal');
    const backdrop = document.getElementById('modalBackdrop');
    const panel = document.getElementById('modalPanel');

    if (!modal || !backdrop || !panel) return;

    backdrop.classList.add('opacity-0');
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');

    // Esperar a que termine la transición (300ms) para ocultar
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};