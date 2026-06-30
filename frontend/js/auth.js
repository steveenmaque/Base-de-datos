/* ========================================
   Auth Module - Login y Registro
   ======================================== */
var AuthModule = (function () {

    function showLogin() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('btn-tab-login').classList.add('active');
        document.getElementById('btn-tab-register').classList.remove('active');
        document.getElementById('login-error').textContent = '';
    }

    function showRegister() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('btn-tab-login').classList.remove('active');
        document.getElementById('btn-tab-register').classList.add('active');
        document.getElementById('register-error').textContent = '';
    }

    async function login(event) {
        event.preventDefault();
        var correo = document.getElementById('login-correo').value.trim();
        var contrasena = document.getElementById('login-password').value;
        var errorEl = document.getElementById('login-error');
        errorEl.textContent = '';

        try {
            var data = await Api.post('/auth/login', { correo: correo, contrasena: contrasena });
            Api.setToken(data.token);
            Api.setUser(data.user);
            App.showApp();
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    async function register(event) {
        event.preventDefault();
        var nombre = document.getElementById('reg-nombre').value.trim();
        var correo = document.getElementById('reg-correo').value.trim();
        var contrasena = document.getElementById('reg-password').value;
        var carrera = document.getElementById('reg-carrera').value.trim() || null;
        var errorEl = document.getElementById('register-error');
        errorEl.textContent = '';

        try {
            var data = await Api.post('/auth/register', {
                nombre: nombre,
                correo: correo,
                contrasena: contrasena,
                carrera: carrera
            });
            Api.setToken(data.token);
            Api.setUser(data.user);
            App.showApp();
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    function logout() {
        Api.removeToken();
        Api.removeUser();
        App.showAuth();
    }

    return {
        showLogin: showLogin,
        showRegister: showRegister,
        login: login,
        register: register,
        logout: logout
    };
})();
