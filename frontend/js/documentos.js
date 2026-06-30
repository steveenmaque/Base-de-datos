/* ========================================
   Documentos Module
   ======================================== */
var DocumentosModule = (function () {

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando documentos...</p></div>';

        try {
            var docs = await Api.get('/reportes/documentos-por-curso');

            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Documentos Academicos</h1>';
            html += '    <p class="page-header-subtitle">Temarios, separatas, resumenes y guias por tema</p>';
            html += '  </div>';
            html += '  <button class="btn btn-gold" onclick="DocumentosModule.openAdd()">+ Nuevo Documento</button>';
            html += '</div>';

            if (docs.length > 0) {
                // Agrupar por curso
                var grouped = {};
                docs.forEach(function (d) {
                    if (!grouped[d.curso]) grouped[d.curso] = [];
                    grouped[d.curso].push(d);
                });

                Object.keys(grouped).forEach(function (curso) {
                    html += '<div class="card" style="margin-bottom: 16px;">';
                    html += '  <div class="card-header"><span class="card-title">' + escapeHtml(curso) + '</span></div>';
                    html += '  <div class="table-container" style="border: none;">';
                    html += '  <table class="data-table">';
                    html += '  <thead><tr><th>Tema</th><th>Temario</th><th>Separata</th><th>Resumen</th><th>Guia</th></tr></thead>';
                    html += '  <tbody>';
                    grouped[curso].forEach(function (d) {
                        html += '<tr>';
                        html += '<td style="font-weight: 600; color: var(--text-primary);">' + escapeHtml(d.tema) + '</td>';
                        html += '<td>' + (d.temario ? '<span class="badge badge-estudiado">' + escapeHtml(d.temario) + '</span>' : '-') + '</td>';
                        html += '<td>' + (d.separata ? '<span class="badge badge-en-proceso">' + escapeHtml(d.separata) + '</span>' : '-') + '</td>';
                        html += '<td>' + (d.resumen ? '<span class="badge badge-dominado">' + escapeHtml(d.resumen) + '</span>' : '-') + '</td>';
                        html += '<td>' + (d.guia ? '<span class="badge badge-reforzar">' + escapeHtml(d.guia) + '</span>' : '-') + '</td>';
                        html += '</tr>';
                    });
                    html += '  </tbody></table></div>';
                    html += '</div>';
                });
            } else {
                html += '<div class="empty-state">';
                html += '  <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
                html += '  <p class="empty-state-title">No hay documentos registrados</p>';
                html += '  <p class="empty-state-desc">Agrega documentos asociados a tus temas de estudio.</p>';
                html += '</div>';
            }

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar documentos</p></div>';
        }
    }

    async function openAdd() {
        var cursos = [];
        try { cursos = await Api.get('/cursos'); } catch (e) { /* sin cursos */ }

        var body = '';
        body += '<form onsubmit="DocumentosModule.add(event)">';
        body += '  <div class="form-group"><label for="doc-curso">Curso</label>';
        body += '    <select id="doc-curso" onchange="DocumentosModule.loadTemas(this.value)" required>';
        body += '      <option value="">Selecciona un curso</option>';
        cursos.forEach(function (c) {
            body += '<option value="' + c.id_curso + '">' + escapeHtml(c.nombre) + '</option>';
        });
        body += '    </select></div>';
        body += '  <div class="form-group"><label for="doc-tema">Tema</label>';
        body += '    <select id="doc-tema" required><option value="">Primero selecciona un curso</option></select></div>';
        body += '  <div class="form-group"><label for="doc-temario">Temario</label><input type="text" id="doc-temario" placeholder="Nombre del archivo de temario"></div>';
        body += '  <div class="form-group"><label for="doc-separata">Separata</label><input type="text" id="doc-separata" placeholder="Nombre del archivo de separata"></div>';
        body += '  <div class="form-group"><label for="doc-resumen">Resumen</label><input type="text" id="doc-resumen" placeholder="Nombre del archivo de resumen"></div>';
        body += '  <div class="form-group"><label for="doc-guia">Guia</label><input type="text" id="doc-guia" placeholder="Nombre del archivo de guia"></div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Crear Documento</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Nuevo Documento', body);
    }

    async function loadTemas(idCurso) {
        var select = document.getElementById('doc-tema');
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

    async function add(event) {
        event.preventDefault();
        var data = {
            id_tema: parseInt(document.getElementById('doc-tema').value),
            temario: document.getElementById('doc-temario').value.trim() || null,
            separata: document.getElementById('doc-separata').value.trim() || null,
            resumen: document.getElementById('doc-resumen').value.trim() || null,
            guia: document.getElementById('doc-guia').value.trim() || null
        };
        if (!data.id_tema) {
            App.toast('Selecciona un tema', 'error');
            return;
        }
        try {
            await Api.post('/documentos', data);
            App.closeModal();
            App.toast('Documento creado correctamente', 'success');
            render();
        } catch (error) { App.toast(error.message, 'error'); }
    }

    return {
        render: render,
        openAdd: openAdd,
        loadTemas: loadTemas,
        add: add
    };
})();
