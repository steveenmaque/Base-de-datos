/* ========================================
   Metas Module - Metas de estudio
   ======================================== */
var MetasModule = (function () {

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando metas...</p></div>';

        try {
            var metas = await Api.get('/metas');

            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Metas de Estudio</h1>';
            html += '    <p class="page-header-subtitle">Define y gestiona tus objetivos academicos</p>';
            html += '  </div>';
            html += '  <button class="btn btn-gold" onclick="MetasModule.openAdd()">+ Nueva Meta</button>';
            html += '</div>';

            // Resumen por estado
            var pendientes = metas.filter(function (m) { return m.estado === 'Pendiente'; }).length;
            var enProceso = metas.filter(function (m) { return m.estado === 'En proceso'; }).length;
            var cumplidas = metas.filter(function (m) { return m.estado === 'Cumplida'; }).length;

            html += '<div class="stats-grid">';
            html += '<div class="stat-card"><div class="stat-icon guinda"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><div class="stat-info"><span class="stat-value">' + pendientes + '</span><span class="stat-label">Pendientes</span></div></div>';
            html += '<div class="stat-card"><div class="stat-icon info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="stat-info"><span class="stat-value">' + enProceso + '</span><span class="stat-label">En Proceso</span></div></div>';
            html += '<div class="stat-card"><div class="stat-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="stat-info"><span class="stat-value">' + cumplidas + '</span><span class="stat-label">Cumplidas</span></div></div>';
            html += '</div>';

            if (metas.length > 0) {
                html += '<div class="metas-list">';
                metas.forEach(function (meta) {
                    var badgeClass = getBadgeClass(meta.estado);
                    html += '<div class="meta-item">';
                    html += '  <span class="meta-item-objetivo">' + escapeHtml(meta.objetivo) + '</span>';
                    html += '  <div class="meta-item-actions">';
                    html += '    <select class="badge ' + badgeClass + '" style="cursor:pointer;border:none;font-family:var(--font-family);font-size:12px;padding:4px 8px;outline:none;" onchange="MetasModule.updateEstado(' + meta.id_meta + ', this.value)">';
                    ['Pendiente', 'En proceso', 'Cumplida'].forEach(function (e) {
                        html += '<option value="' + e + '"' + (meta.estado === e ? ' selected' : '') + '>' + e + '</option>';
                    });
                    html += '    </select>';
                    html += '    <button class="btn btn-sm btn-outline" onclick="MetasModule.openEdit(' + meta.id_meta + ', \'' + escapeHtml(meta.objetivo).replace(/'/g, "\\'") + '\', \'' + meta.estado + '\')">Editar</button>';
                    html += '    <button class="btn btn-sm btn-danger" onclick="MetasModule.remove(' + meta.id_meta + ')">Eliminar</button>';
                    html += '  </div>';
                    html += '</div>';
                });
                html += '</div>';
            } else {
                html += '<div class="empty-state">';
                html += '  <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
                html += '  <p class="empty-state-title">No hay metas registradas</p>';
                html += '  <p class="empty-state-desc">Define tus metas de estudio para mantenerte enfocado.</p>';
                html += '</div>';
            }

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar metas</p></div>';
        }
    }

    function openAdd() {
        var body = '';
        body += '<form onsubmit="MetasModule.add(event)">';
        body += '  <div class="form-group"><label for="meta-objetivo">Objetivo</label><input type="text" id="meta-objetivo" placeholder="Ej: Dominar todos los temas de Algebra" required></div>';
        body += '  <div class="form-group"><label for="meta-estado">Estado</label>';
        body += '    <select id="meta-estado"><option value="Pendiente">Pendiente</option><option value="En proceso">En proceso</option><option value="Cumplida">Cumplida</option></select>';
        body += '  </div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Crear Meta</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Nueva Meta', body);
    }

    async function add(event) {
        event.preventDefault();
        try {
            await Api.post('/metas', {
                objetivo: document.getElementById('meta-objetivo').value.trim(),
                estado: document.getElementById('meta-estado').value
            });
            App.closeModal();
            App.toast('Meta creada correctamente', 'success');
            render();
        } catch (error) { App.toast(error.message, 'error'); }
    }

    function openEdit(id, objetivo, estado) {
        var body = '';
        body += '<form onsubmit="MetasModule.edit(event, ' + id + ')">';
        body += '  <div class="form-group"><label for="meta-e-objetivo">Objetivo</label><input type="text" id="meta-e-objetivo" value="' + objetivo + '" required></div>';
        body += '  <div class="form-group"><label for="meta-e-estado">Estado</label>';
        body += '    <select id="meta-e-estado">';
        ['Pendiente', 'En proceso', 'Cumplida'].forEach(function (e) {
            body += '<option value="' + e + '"' + (estado === e ? ' selected' : '') + '>' + e + '</option>';
        });
        body += '    </select></div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Guardar</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Editar Meta', body);
    }

    async function edit(event, id) {
        event.preventDefault();
        try {
            await Api.put('/metas/' + id, {
                objetivo: document.getElementById('meta-e-objetivo').value.trim(),
                estado: document.getElementById('meta-e-estado').value
            });
            App.closeModal();
            App.toast('Meta actualizada', 'success');
            render();
        } catch (error) { App.toast(error.message, 'error'); }
    }

    async function updateEstado(id, estado) {
        try {
            await Api.put('/metas/' + id, { estado: estado });
            App.toast('Estado actualizado', 'success');
            render();
        } catch (error) { App.toast(error.message, 'error'); }
    }

    async function remove(id) {
        if (!confirm('Estas seguro de eliminar esta meta?')) return;
        try {
            await Api.del('/metas/' + id);
            App.toast('Meta eliminada', 'success');
            render();
        } catch (error) { App.toast(error.message, 'error'); }
    }

    return {
        render: render,
        openAdd: openAdd,
        add: add,
        openEdit: openEdit,
        edit: edit,
        updateEstado: updateEstado,
        remove: remove
    };
})();
