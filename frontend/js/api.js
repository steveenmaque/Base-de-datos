/* ========================================
   API Client - Modulo de comunicacion HTTP
   ======================================== */
var Api = (function () {
    var BASE_URL = '/api';

    function getToken() {
        return localStorage.getItem('prepatrack_token');
    }

    function setToken(token) {
        localStorage.setItem('prepatrack_token', token);
    }

    function removeToken() {
        localStorage.removeItem('prepatrack_token');
    }

    function getUser() {
        var data = localStorage.getItem('prepatrack_user');
        return data ? JSON.parse(data) : null;
    }

    function setUser(user) {
        localStorage.setItem('prepatrack_user', JSON.stringify(user));
    }

    function removeUser() {
        localStorage.removeItem('prepatrack_user');
    }

    async function request(method, path, body) {
        var headers = {
            'Content-Type': 'application/json'
        };
        var token = getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        var options = {
            method: method,
            headers: headers
        };
        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }
        try {
            var response = await fetch(BASE_URL + path, options);
            var data = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    removeToken();
                    removeUser();
                    window.location.reload();
                }
                throw new Error(data.message || 'Error en la solicitud');
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    function get(path) {
        return request('GET', path);
    }

    function post(path, body) {
        return request('POST', path, body);
    }

    function put(path, body) {
        return request('PUT', path, body);
    }

    function del(path) {
        return request('DELETE', path);
    }

    return {
        getToken: getToken,
        setToken: setToken,
        removeToken: removeToken,
        getUser: getUser,
        setUser: setUser,
        removeUser: removeUser,
        get: get,
        post: post,
        put: put,
        del: del
    };
})();
