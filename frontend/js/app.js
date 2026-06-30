/* ========================================
   App - Orquestador principal de PrepaTrack
   Controla el arranque, la navegacion entre paginas,
   el modal generico y las notificaciones (toasts).
   ======================================== */
var App = (function () {

    // Mapa de cada pagina a la funcion de renderizado de su modulo
    var pages = {
        dashboard:  function () { return DashboardModule.render(); },
        cursos:     function () { return CursosModule.render(); },
        simulacros: function () { return SimulacrosModule.render(); },
        horarios:   function () { return HorariosModule.render(); },
        metas:      function () { return MetasModule.render(); },
        sesiones:   function () { return SesionesModule.render(); },
        documentos: function () { return DocumentosModule.render(); },
        flashcards: function () { return FlashcardsModule.render(); },
        reportes:   function () { return ReportesModule.render(); }
    };

    var currentPage = 'dashboard';

    // Mostrar la aplicacion principal tras autenticarse
    function showApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        loadUserInfo();
        navigate('dashboard');
    }

    // Mostrar la pantalla de inicio de sesion / registro
    function showAuth() {
        document.getElementById('app-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');

        var loginForm = document.getElementById('login-form');
        var registerForm = document.getElementById('register-form');
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        AuthModule.showLogin();
    }

    // Cargar los datos del usuario autenticado en la barra lateral
    function loadUserInfo() {
        var user = Api.getUser();
        if (!user) return;
        var nombre = user.nombre || 'Usuario';
        document.getElementById('user-name').textContent = nombre;
        document.getElementById('user-career').textContent = user.carrera || 'Estudiante';
        document.getElementById('user-initial').textContent = nombre.charAt(0).toUpperCase();
    }

    // Navegar a una pagina: marca el item activo y renderiza su modulo
    function navigate(page) {
        if (!pages[page]) page = 'dashboard';
        currentPage = page;

        // Actualizar el item activo del menu lateral
        var navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        navItems.forEach(function (item) { item.classList.remove('active'); });
        var activeItem = document.getElementById('nav-' + page);
        if (activeItem) activeItem.classList.add('active');

        // Renderizar el contenido de la pagina
        pages[page]();
    }

    // Abrir el modal generico con un titulo y contenido HTML
    function openModal(title, bodyHtml) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    // Cerrar el modal generico
    function closeModal(event) {
        // Cuando proviene de un clic en el fondo, cerrar solo si se hizo
        // clic directamente sobre el overlay y no sobre su contenido
        if (event && event.target !== event.currentTarget) return;
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('modal-body').innerHTML = '';
    }

    // Mostrar una notificacion temporal (toast)
    function toast(message, type) {
        var container = document.getElementById('toast-container');
        if (!container) return;

        var tipo = type || 'info';
        var el = document.createElement('div');
        el.className = 'toast toast-' + tipo;

        var msg = document.createElement('span');
        msg.className = 'toast-message';
        msg.textContent = message;
        el.appendChild(msg);

        container.appendChild(el);

        // Desvanecer y eliminar el toast tras unos segundos
        setTimeout(function () {
            el.style.transition = 'opacity 0.3s ease';
            el.style.opacity = '0';
            setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 300);
        }, 3000);
    }

    // Inicializacion: decidir que pantalla mostrar segun la sesion guardada
    function init() {
        // Cerrar el modal con la tecla Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });

        if (Api.getToken() && Api.getUser()) {
            showApp();
        } else {
            showAuth();
        }
    }

    return {
        showApp: showApp,
        showAuth: showAuth,
        navigate: navigate,
        openModal: openModal,
        closeModal: closeModal,
        toast: toast,
        init: init
    };
})();

/* ========================================
   Funciones utilitarias globales
   Usadas por todos los modulos de renderizado.
   ======================================== */

// Escapar texto para insertarlo de forma segura en el HTML.
// No se escapa la comilla simple porque los modulos manejan su propio
// escape para incrustar valores dentro de cadenas JavaScript de los onclick.
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Devolver la clase CSS del badge segun el estado de tema o meta
function getBadgeClass(estado) {
    var map = {
        'No iniciado': 'badge-no-iniciado',
        'En proceso':  'badge-en-proceso',
        'Estudiado':   'badge-estudiado',
        'Reforzar':    'badge-reforzar',
        'Dominado':    'badge-dominado',
        'Pendiente':   'badge-pendiente',
        'Cumplida':    'badge-cumplida'
    };
    return map[estado] || 'badge-no-iniciado';
}

// Arrancar la aplicacion cuando el DOM este listo
document.addEventListener('DOMContentLoaded', App.init);
