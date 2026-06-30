/* ========================================
   Dashboard Module - Panel Principal
   ======================================== */
var DashboardModule = (function () {

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando panel principal...</p></div>';

        try {
            var avanceData = [];
            var conteoData = [];
            var simulacrosData = [];
            var progresoData = { porcentaje_av: 0 };
            var metasData = [];

            try { avanceData = await Api.get('/reportes/avance-por-curso'); } catch (e) { /* sin datos */ }
            try { conteoData = await Api.get('/reportes/conteo-temas'); } catch (e) { /* sin datos */ }
            try { simulacrosData = await Api.get('/reportes/evolucion-simulacros'); } catch (e) { /* sin datos */ }
            try { progresoData = await Api.get('/progreso'); } catch (e) { /* sin datos */ }
            try { metasData = await Api.get('/reportes/cumplimiento-metas'); } catch (e) { /* sin datos */ }

            var totalCursos = avanceData.length || 0;
            var totalTemas = 0;
            var temasDominados = 0;
            avanceData.forEach(function (c) {
                totalTemas += parseInt(c.total_temas) || 0;
                temasDominados += parseInt(c.temas_dominados) || 0;
            });
            var totalSimulacros = simulacrosData.length || 0;
            var porcentajeGlobal = parseFloat(progresoData.porcentaje_av) || 0;

            var totalMetas = 0;
            var metasCumplidas = 0;
            if (Array.isArray(metasData)) {
                metasData.forEach(function (m) {
                    totalMetas += parseInt(m.cantidad) || 0;
                    if (m.estado === 'Cumplida') {
                        metasCumplidas += parseInt(m.cantidad) || 0;
                    }
                });
            }

            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Panel Principal</h1>';
            html += '    <p class="page-header-subtitle">Resumen general de tu progreso academico</p>';
            html += '  </div>';
            html += '</div>';

            // Estadisticas rapidas
            html += '<div class="stats-grid">';
            html += renderStatCard('guinda', iconBook(), porcentajeGlobal.toFixed(1) + '%', 'Progreso Global');
            html += renderStatCard('gold', iconLayers(), totalCursos.toString(), 'Cursos Activos');
            html += renderStatCard('success', iconCheck(), temasDominados + '/' + totalTemas, 'Temas Dominados');
            html += renderStatCard('info', iconFile(), totalSimulacros.toString(), 'Simulacros Realizados');
            html += '</div>';

            // Barra de progreso global
            html += '<div class="card" style="margin-bottom: 20px;">';
            html += '  <div class="card-header">';
            html += '    <span class="card-title">Progreso Global de Avance</span>';
            html += '    <span class="progress-text">' + porcentajeGlobal.toFixed(1) + '%</span>';
            html += '  </div>';
            html += '  <div class="progress-bar">';
            html += '    <div class="progress-fill" style="width: ' + porcentajeGlobal + '%"></div>';
            html += '  </div>';
            html += '</div>';

            html += '<div class="dashboard-grid">';

            // Avance por curso
            html += '<div class="card">';
            html += '  <div class="card-header"><span class="card-title">Avance por Curso</span></div>';
            if (avanceData.length > 0) {
                avanceData.forEach(function (c) {
                    var pct = parseFloat(c.porcentaje_avance) || 0;
                    html += '<div style="margin-bottom: 14px;">';
                    html += '  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">';
                    html += '    <span style="font-size: 13px; color: var(--text-secondary);">' + escapeHtml(c.curso) + '</span>';
                    html += '    <span class="progress-text">' + pct.toFixed(1) + '%</span>';
                    html += '  </div>';
                    html += '  <div class="progress-bar">';
                    html += '    <div class="progress-fill" style="width: ' + pct + '%"></div>';
                    html += '  </div>';
                    html += '</div>';
                });
            } else {
                html += '<p style="color: var(--text-muted); font-size: 14px;">No hay cursos registrados aun.</p>';
            }
            html += '</div>';

            // Conteo de temas por estado
            html += '<div class="card">';
            html += '  <div class="card-header"><span class="card-title">Temas por Estado</span></div>';
            if (conteoData.length > 0) {
                conteoData.forEach(function (item) {
                    var badgeClass = getBadgeClass(item.estado);
                    html += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">';
                    html += '  <span class="badge ' + badgeClass + '">' + escapeHtml(item.estado) + '</span>';
                    html += '  <span style="font-size: 20px; font-weight: 700; color: var(--text-primary);">' + item.cantidad + '</span>';
                    html += '</div>';
                });
            } else {
                html += '<p style="color: var(--text-muted); font-size: 14px;">No hay temas registrados aun.</p>';
            }
            html += '</div>';

            // Evolucion de simulacros
            html += '<div class="card card-wide">';
            html += '  <div class="card-header"><span class="card-title">Evolucion de Simulacros</span></div>';
            if (simulacrosData.length > 0) {
                var maxPuntaje = Math.max.apply(null, simulacrosData.map(function (s) { return s.puntaje; }));
                html += '<div class="chart-bars">';
                simulacrosData.forEach(function (s) {
                    var heightPct = maxPuntaje > 0 ? (s.puntaje / maxPuntaje * 100) : 0;
                    var fechaStr = new Date(s.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
                    html += '<div class="chart-bar-item">';
                    html += '  <span class="chart-bar-value">' + s.puntaje + '</span>';
                    html += '  <div class="chart-bar" style="height: ' + heightPct + '%;"></div>';
                    html += '  <span class="chart-bar-label">' + fechaStr + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            } else {
                html += '<p style="color: var(--text-muted); font-size: 14px;">No hay simulacros registrados aun.</p>';
            }
            html += '</div>';

            html += '</div>'; // dashboard-grid

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar el panel</p><p class="empty-state-desc">' + escapeHtml(error.message) + '</p></div>';
        }
    }

    function renderStatCard(colorClass, icon, value, label) {
        return '<div class="stat-card">' +
            '<div class="stat-icon ' + colorClass + '">' + icon + '</div>' +
            '<div class="stat-info">' +
            '<span class="stat-value">' + value + '</span>' +
            '<span class="stat-label">' + label + '</span>' +
            '</div></div>';
    }

    function iconBook() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';
    }
    function iconLayers() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
    }
    function iconCheck() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    }
    function iconFile() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    }

    return {
        render: render
    };
})();
