/* ========================================
   Sesiones Module - Sesiones de estudio
   ======================================== */
var SesionesModule = (function () {

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando sesiones...</p></div>';

        try {
            var sesiones = await Api.get('/sesiones');

            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Sesiones de Estudio</h1>';
            html += '    <p class="page-header-subtitle">Registra el tiempo invertido y tu nivel de comprension</p>';
            html += '  </div>';
            html += '  <button class="btn btn-gold" onclick="SesionesModule.openAdd()">+ Nueva Sesion</button>';
            html += '</div>';

            if (sesiones.length > 0) {
                html += '<div class="table-container">';
                html += '<table class="data-table">';
                html += '<thead><tr><th>Curso</th><th>Tema</th><th>Tiempo</th><th>Comprension</th><th>Acciones</th></tr></thead>';
                html += '<tbody>';
                sesiones.forEach(function (s) {
                    var tiempo = formatTiempo(s.tiempo_hora, s.tiempo_minuto, s.tiempo_segundo);
                    html += '<tr>';
                    html += '<td>' + escapeHtml(s.curso_nombre || '-') + '</td>';
                    html += '<td>' + escapeHtml(s.tema_nombre || '-') + '</td>';
                    html += '<td>' + tiempo + '</td>';
                    html += '<td>' + renderStars(s.nivel_comprension) + '</td>';
                    html += '<td><button class="btn btn-sm btn-danger" onclick="SesionesModule.remove(' + s.id_sesion + ')">Eliminar</button></td>';
                    html += '</tr>';
                });
                html += '</tbody></table></div>';
            } else {
                html += '<div class="empty-state">';
                html += '  <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
                html += '  <p class="empty-state-title">No hay sesiones registradas</p>';
                html += '  <p class="empty-state-desc">Registra tus sesiones de estudio para hacer seguimiento de tu dedicacion.</p>';
                html += '</div>';
            }

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar sesiones</p></div>';
        }
    }

    function formatTiempo(h, m, s) {
        var parts = [];
        if (h > 0) parts.push(h + 'h');
        if (m > 0) parts.push(m + 'min');
        if (s > 0) parts.push(s + 's');
        return parts.length > 0 ? parts.join(' ') : '0min';
    }

    function renderStars(nivel) {
        var html = '<div class="comprension-stars">';
        for (var i = 1; i <= 5; i++) {
            var filled = i <= nivel ? ' filled' : '';
            html += '<svg class="star' + filled + '" viewBox="0 0 24 24" fill="' + (i <= nivel ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        }
        html += '</div>';
        return html;
    }

    async function openAdd() {
        // Cargar cursos y temas para el selector
        var cursos = [];
        try { cursos = await Api.get('/cursos'); } catch (e) { /* sin cursos */ }

        var body = '';
        body += '<form onsubmit="SesionesModule.add(event)">';
        body += '  <div class="form-group"><label for="ses-curso">Curso</label>';
        body += '    <select id="ses-curso" onchange="SesionesModule.loadTemas(this.value)" required>';
        body += '      <option value="">Selecciona un curso</option>';
        cursos.forEach(function (c) {
            body += '<option value="' + c.id_curso + '">' + escapeHtml(c.nombre) + '</option>';
        });
        body += '    </select></div>';
        body += '  <div class="form-group"><label for="ses-tema">Tema</label>';
        body += '    <select id="ses-tema" required><option value="">Primero selecciona un curso</option></select>';
        body += '  </div>';
        body += '  <div class="form-row-3">';
        body += '    <div class="form-group"><label for="ses-hora">Horas</label><input type="number" id="ses-hora" value="0" min="0" max="23"></div>';
        body += '    <div class="form-group"><label for="ses-min">Minutos</label><input type="number" id="ses-min" value="0" min="0" max="59"></div>';
        body += '    <div class="form-group"><label for="ses-seg">Segundos</label><input type="number" id="ses-seg" value="0" min="0" max="59"></div>';
        body += '  </div>';
        body += '  <div class="form-group"><label>Nivel de comprension (1-5)</label>';
        body += '    <div class="comprension-stars" id="ses-stars">';
        for (var i = 1; i <= 5; i++) {
            body += '<svg class="star" onclick="SesionesModule.setStar(' + i + ')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        }
        body += '    </div>';
        body += '    <input type="hidden" id="ses-nivel" value="1">';
        body += '  </div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Registrar Sesion</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Nueva Sesion de Estudio', body);
    }

    async function loadTemas(idCurso) {
        var select = document.getElementById('ses-tema');
        if (!idCurso) {
            select.innerHTML = '<option value="">Primero selecciona un curso</option>';
            return;
        }
        try {
            var temas = await Api.get('/temas/curso/' + idCurso);
            var html = '<option value="">Selecciona un tema</option>';
            temas.forEach(function (t) {
                html += '<option value="' + t.id_tema + '">' + escapeHtml(t.nombre) + '</option>';
            });
            select.innerHTML = html;
        } catch (e) {
            select.innerHTML = '<option value="">Error al cargar temas</option>';
        }
    }

    function setStar(nivel) {
        document.getElementById('ses-nivel').value = nivel;
        var stars = document.getElementById('ses-stars').querySelectorAll('.star');
        stars.forEach(function (star, index) {
            if (index < nivel) {
                star.classList.add('filled');
                star.setAttribute('fill', 'currentColor');
            } else {
                star.classList.remove('filled');
                star.setAttribute('fill', 'none');
            }
        });
    }

    async function add(event) {
        event.preventDefault();
        var data = {
            id_tema: parseInt(document.getElementById('ses-tema').value),
            tiempo_hora: parseInt(document.getElementById('ses-hora').value) || 0,
            tiempo_minuto: parseInt(document.getElementById('ses-min').value) || 0,
            tiempo_segundo: parseInt(document.getElementById('ses-seg').value) || 0,
            nivel_comprension: parseInt(document.getElementById('ses-nivel').value) || 1
        };
        if (!data.id_tema) {
            App.toast('Selecciona un tema', 'error');
            return;
        }
        try {
            await Api.post('/sesiones', data);
            App.closeModal();
            App.toast('Sesion registrada correctamente', 'success');
            render();
        } catch (error) { App.toast(error.message, 'error'); }
    }

    async function remove(id) {
        if (!confirm('Estas seguro de eliminar esta sesion?')) return;
        try {
            await Api.del('/sesiones/' + id);
            App.toast('Sesion eliminada', 'success');
            render();
        } catch (error) { App.toast(error.message, 'error'); }
    }

    return {
        render: render,
        openAdd: openAdd,
        loadTemas: loadTemas,
        setStar: setStar,
        add: add,
        remove: remove
    };
})();
