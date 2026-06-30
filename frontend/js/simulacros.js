/* ========================================
   Simulacros Module
   ======================================== */
var SimulacrosModule = (function () {

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando simulacros...</p></div>';

        try {
            var simulacros = await Api.get('/simulacros');
            var stats = null;
            try { stats = await Api.get('/reportes/estadisticas-simulacros'); } catch (e) { /* sin datos */ }

            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Simulacros</h1>';
            html += '    <p class="page-header-subtitle">Registra y analiza tus examenes de practica</p>';
            html += '  </div>';
            html += '  <button class="btn btn-gold" onclick="SimulacrosModule.openAdd()">+ Nuevo Simulacro</button>';
            html += '</div>';

            // Estadisticas
            if (stats) {
                html += '<div class="stats-grid">';
                html += '<div class="stat-card"><div class="stat-icon guinda"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="stat-info"><span class="stat-value">' + (stats.total_simulacros || 0) + '</span><span class="stat-label">Total Simulacros</span></div></div>';
                html += '<div class="stat-card"><div class="stat-icon gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div><div class="stat-info"><span class="stat-value">' + (stats.promedio || 0) + '</span><span class="stat-label">Promedio</span></div></div>';
                html += '<div class="stat-card"><div class="stat-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg></div><div class="stat-info"><span class="stat-value">' + (stats.mejor_puntaje || '-') + '</span><span class="stat-label">Mejor Puntaje</span></div></div>';
                html += '<div class="stat-card"><div class="stat-icon info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg></div><div class="stat-info"><span class="stat-value">' + (stats.peor_puntaje || '-') + '</span><span class="stat-label">Menor Puntaje</span></div></div>';
                html += '</div>';
            }

            // Tabla de simulacros
            if (simulacros.length > 0) {
                html += '<div class="table-container">';
                html += '<table class="data-table">';
                html += '<thead><tr><th>Fecha</th><th>Puntaje</th><th>Tiempo</th><th>Correccion</th><th>Acciones</th></tr></thead>';
                html += '<tbody>';
                simulacros.forEach(function (s) {
                    var fecha = new Date(s.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
                    html += '<tr>';
                    html += '<td>' + fecha + '</td>';
                    html += '<td><span style="font-weight: 700; color: var(--dorado-400);">' + s.puntaje + '</span></td>';
                    html += '<td>' + (s.tiempo || '-') + '</td>';
                    html += '<td>' + (s.correccion ? escapeHtml(s.correccion) : '-') + '</td>';
                    html += '<td>';
                    html += '  <button class="btn btn-sm btn-outline" onclick="SimulacrosModule.openEdit(' + s.id_simulacro + ')">Editar</button> ';
                    html += '  <button class="btn btn-sm btn-danger" onclick="SimulacrosModule.remove(' + s.id_simulacro + ')">Eliminar</button>';
                    html += '</td>';
                    html += '</tr>';
                });
                html += '</tbody></table></div>';
            } else {
                html += '<div class="empty-state">';
                html += '  <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
                html += '  <p class="empty-state-title">No hay simulacros registrados</p>';
                html += '  <p class="empty-state-desc">Registra tu primer simulacro para hacer seguimiento de tu desempeno.</p>';
                html += '</div>';
            }

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar simulacros</p></div>';
        }
    }

    function openAdd() {
        var today = new Date().toISOString().split('T')[0];
        var body = '';
        body += '<form onsubmit="SimulacrosModule.add(event)">';
        body += '  <div class="form-row">';
        body += '    <div class="form-group"><label for="sim-fecha">Fecha</label><input type="date" id="sim-fecha" value="' + today + '" required></div>';
        body += '    <div class="form-group"><label for="sim-puntaje">Puntaje</label><input type="number" id="sim-puntaje" placeholder="Ej: 750" required min="0"></div>';
        body += '  </div>';
        body += '  <div class="form-row">';
        body += '    <div class="form-group"><label for="sim-tiempo">Tiempo (HH:MM:SS)</label><input type="time" id="sim-tiempo" step="1"></div>';
        body += '    <div class="form-group"><label for="sim-correccion">Correccion</label><input type="text" id="sim-correccion" placeholder="Ej: 40C/10I"></div>';
        body += '  </div>';
        body += '  <div class="form-group"><label for="sim-archivo">Archivo adjunto</label><input type="text" id="sim-archivo" placeholder="Ruta o nombre del archivo"></div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Registrar</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Nuevo Simulacro', body);
    }

    async function add(event) {
        event.preventDefault();
        var data = {
            fecha: document.getElementById('sim-fecha').value,
            puntaje: parseInt(document.getElementById('sim-puntaje').value),
            tiempo: document.getElementById('sim-tiempo').value || null,
            correccion: document.getElementById('sim-correccion').value.trim() || null,
            archivo: document.getElementById('sim-archivo').value.trim() || null
        };
        try {
            await Api.post('/simulacros', data);
            App.closeModal();
            App.toast('Simulacro registrado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    async function openEdit(id) {
        try {
            var simulacros = await Api.get('/simulacros');
            var s = simulacros.find(function (x) { return x.id_simulacro === id; });
            if (!s) return;
            var fecha = new Date(s.fecha).toISOString().split('T')[0];
            var body = '';
            body += '<form onsubmit="SimulacrosModule.edit(event, ' + id + ')">';
            body += '  <div class="form-row">';
            body += '    <div class="form-group"><label for="sim-e-fecha">Fecha</label><input type="date" id="sim-e-fecha" value="' + fecha + '" required></div>';
            body += '    <div class="form-group"><label for="sim-e-puntaje">Puntaje</label><input type="number" id="sim-e-puntaje" value="' + s.puntaje + '" required min="0"></div>';
            body += '  </div>';
            body += '  <div class="form-row">';
            body += '    <div class="form-group"><label for="sim-e-tiempo">Tiempo</label><input type="time" id="sim-e-tiempo" step="1" value="' + (s.tiempo || '') + '"></div>';
            body += '    <div class="form-group"><label for="sim-e-correccion">Correccion</label><input type="text" id="sim-e-correccion" value="' + escapeHtml(s.correccion || '') + '"></div>';
            body += '  </div>';
            body += '  <div class="modal-actions">';
            body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
            body += '    <button type="submit" class="btn btn-gold">Guardar</button>';
            body += '  </div>';
            body += '</form>';
            App.openModal('Editar Simulacro', body);
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    async function edit(event, id) {
        event.preventDefault();
        var data = {
            fecha: document.getElementById('sim-e-fecha').value,
            puntaje: parseInt(document.getElementById('sim-e-puntaje').value),
            tiempo: document.getElementById('sim-e-tiempo').value || null,
            correccion: document.getElementById('sim-e-correccion').value.trim() || null
        };
        try {
            await Api.put('/simulacros/' + id, data);
            App.closeModal();
            App.toast('Simulacro actualizado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    async function remove(id) {
        if (!confirm('Estas seguro de eliminar este simulacro?')) return;
        try {
            await Api.del('/simulacros/' + id);
            App.toast('Simulacro eliminado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    return {
        render: render,
        openAdd: openAdd,
        add: add,
        openEdit: openEdit,
        edit: edit,
        remove: remove
    };
})();
