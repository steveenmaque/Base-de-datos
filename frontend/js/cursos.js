/* ========================================
   Cursos y Temas Module
   ======================================== */
var CursosModule = (function () {
    var cursosCache = [];

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando cursos...</p></div>';

        try {
            cursosCache = await Api.get('/cursos');

            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Cursos y Temas</h1>';
            html += '    <p class="page-header-subtitle">Gestiona tus cursos y el avance de cada tema</p>';
            html += '  </div>';
            html += '  <button class="btn btn-gold" onclick="CursosModule.openAddCurso()">+ Nuevo Curso</button>';
            html += '</div>';

            if (cursosCache.length === 0) {
                html += '<div class="empty-state">';
                html += '  <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';
                html += '  <p class="empty-state-title">No hay cursos registrados</p>';
                html += '  <p class="empty-state-desc">Crea tu primer curso para comenzar a organizar tus temas de estudio.</p>';
                html += '</div>';
            } else {
                html += '<div class="cursos-grid">';
                for (var i = 0; i < cursosCache.length; i++) {
                    html += await renderCursoCard(cursosCache[i]);
                }
                html += '</div>';
            }

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar cursos</p><p class="empty-state-desc">' + escapeHtml(error.message) + '</p></div>';
        }
    }

    async function renderCursoCard(curso) {
        var temas = [];
        try {
            temas = await Api.get('/temas/curso/' + curso.id_curso);
        } catch (e) { /* sin temas */ }

        var totalTemas = temas.length;
        var dominados = temas.filter(function (t) { return t.estado === 'Dominado'; }).length;
        var pct = totalTemas > 0 ? (dominados / totalTemas * 100) : 0;

        var html = '';
        html += '<div class="curso-card" id="curso-' + curso.id_curso + '">';
        html += '  <div class="curso-card-header">';
        html += '    <span class="curso-card-name">' + escapeHtml(curso.nombre) + '</span>';
        html += '    <div class="curso-card-actions">';
        html += '      <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); CursosModule.openEditCurso(' + curso.id_curso + ', \'' + escapeHtml(curso.nombre).replace(/'/g, "\\'") + '\')">Editar</button>';
        html += '      <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); CursosModule.deleteCurso(' + curso.id_curso + ')">Eliminar</button>';
        html += '    </div>';
        html += '  </div>';

        // Progreso del curso
        html += '  <div style="margin-bottom: 12px;">';
        html += '    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">';
        html += '      <span style="font-size: 12px; color: var(--text-muted);">' + dominados + ' de ' + totalTemas + ' temas dominados</span>';
        html += '      <span class="progress-text">' + pct.toFixed(0) + '%</span>';
        html += '    </div>';
        html += '    <div class="progress-bar"><div class="progress-fill" style="width: ' + pct + '%"></div></div>';
        html += '  </div>';

        // Lista de temas
        html += '  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
        html += '    <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Temas</span>';
        html += '    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); CursosModule.openAddTema(' + curso.id_curso + ')">+ Tema</button>';
        html += '  </div>';

        if (temas.length > 0) {
            html += '  <div class="tema-list">';
            temas.forEach(function (tema) {
                var badgeClass = getBadgeClass(tema.estado);
                html += '<div class="tema-item">';
                html += '  <div class="tema-item-info">';
                html += '    <span class="tema-item-name">' + escapeHtml(tema.nombre) + '</span>';
                html += '  </div>';
                html += '  <div class="tema-item-actions">';
                html += '    <select class="badge ' + badgeClass + '" style="cursor: pointer; border: none; font-family: var(--font-family); font-size: 12px; padding: 4px 8px; outline: none;" onchange="CursosModule.updateTemaEstado(' + tema.id_tema + ', this.value)">';
                var estados = ['No iniciado', 'En proceso', 'Estudiado', 'Reforzar', 'Dominado'];
                estados.forEach(function (e) {
                    html += '<option value="' + e + '"' + (tema.estado === e ? ' selected' : '') + '>' + e + '</option>';
                });
                html += '    </select>';
                html += '    <button class="btn-delete-sm" onclick="CursosModule.deleteTema(' + tema.id_tema + ', ' + curso.id_curso + ')" title="Eliminar tema">&times;</button>';
                html += '  </div>';
                html += '</div>';
            });
            html += '  </div>';
        } else {
            html += '  <p style="font-size: 13px; color: var(--text-muted); padding: 8px 0;">Sin temas registrados.</p>';
        }

        html += '</div>';
        return html;
    }

    function openAddCurso() {
        var body = '';
        body += '<form id="form-add-curso" onsubmit="CursosModule.addCurso(event)">';
        body += '  <div class="form-group">';
        body += '    <label for="input-curso-nombre">Nombre del curso</label>';
        body += '    <input type="text" id="input-curso-nombre" placeholder="Ej: Algebra" required>';
        body += '  </div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Crear Curso</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Nuevo Curso', body);
    }

    async function addCurso(event) {
        event.preventDefault();
        var nombre = document.getElementById('input-curso-nombre').value.trim();
        try {
            await Api.post('/cursos', { nombre: nombre });
            App.closeModal();
            App.toast('Curso creado correctamente', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    function openEditCurso(id, nombre) {
        var body = '';
        body += '<form onsubmit="CursosModule.editCurso(event, ' + id + ')">';
        body += '  <div class="form-group">';
        body += '    <label for="input-edit-curso">Nombre del curso</label>';
        body += '    <input type="text" id="input-edit-curso" value="' + nombre + '" required>';
        body += '  </div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Guardar</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Editar Curso', body);
    }

    async function editCurso(event, id) {
        event.preventDefault();
        var nombre = document.getElementById('input-edit-curso').value.trim();
        try {
            await Api.put('/cursos/' + id, { nombre: nombre });
            App.closeModal();
            App.toast('Curso actualizado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    async function deleteCurso(id) {
        if (!confirm('Estas seguro de eliminar este curso? Se eliminaran todos sus temas, documentos y flashcards.')) return;
        try {
            await Api.del('/cursos/' + id);
            App.toast('Curso eliminado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    function openAddTema(idCurso) {
        var body = '';
        body += '<form onsubmit="CursosModule.addTema(event, ' + idCurso + ')">';
        body += '  <div class="form-group">';
        body += '    <label for="input-tema-nombre">Nombre del tema</label>';
        body += '    <input type="text" id="input-tema-nombre" placeholder="Ej: Ecuaciones Lineales" required>';
        body += '  </div>';
        body += '  <div class="form-group">';
        body += '    <label for="input-tema-estado">Estado</label>';
        body += '    <select id="input-tema-estado">';
        body += '      <option value="No iniciado">No iniciado</option>';
        body += '      <option value="En proceso">En proceso</option>';
        body += '      <option value="Estudiado">Estudiado</option>';
        body += '      <option value="Reforzar">Reforzar</option>';
        body += '      <option value="Dominado">Dominado</option>';
        body += '    </select>';
        body += '  </div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Crear Tema</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Nuevo Tema', body);
    }

    async function addTema(event, idCurso) {
        event.preventDefault();
        var nombre = document.getElementById('input-tema-nombre').value.trim();
        var estado = document.getElementById('input-tema-estado').value;
        try {
            await Api.post('/temas', { id_curso: idCurso, nombre: nombre, estado: estado });
            App.closeModal();
            App.toast('Tema creado correctamente', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    async function updateTemaEstado(idTema, estado) {
        try {
            await Api.put('/temas/' + idTema, { estado: estado });
            App.toast('Estado actualizado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    async function deleteTema(idTema, idCurso) {
        if (!confirm('Estas seguro de eliminar este tema?')) return;
        try {
            await Api.del('/temas/' + idTema);
            App.toast('Tema eliminado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    return {
        render: render,
        openAddCurso: openAddCurso,
        addCurso: addCurso,
        openEditCurso: openEditCurso,
        editCurso: editCurso,
        deleteCurso: deleteCurso,
        openAddTema: openAddTema,
        addTema: addTema,
        updateTemaEstado: updateTemaEstado,
        deleteTema: deleteTema
    };
})();
