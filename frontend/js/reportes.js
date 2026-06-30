/* ========================================
   Reportes Module - Consultas de aplicacion
   ======================================== */
var ReportesModule = (function () {

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando reportes...</p></div>';

        try {
            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Reportes y Estadisticas</h1>';
            html += '    <p class="page-header-subtitle">Consultas de aplicacion del sistema PrepaTrack</p>';
            html += '  </div>';
            html += '</div>';

            html += '<div class="reportes-grid">';

            // Cargar datos en paralelo
            var results = await Promise.allSettled([
                Api.get('/reportes/avance-por-curso'),
                Api.get('/reportes/temas-pendientes'),
                Api.get('/reportes/cursos-completos'),
                Api.get('/reportes/estadisticas-simulacros'),
                Api.get('/reportes/mejor-simulacro'),
                Api.get('/reportes/simulacros-recientes'),
                Api.get('/reportes/tiempo-estudio-curso'),
                Api.get('/reportes/comprension-por-tema'),
                Api.get('/reportes/temas-baja-comprension'),
                Api.get('/reportes/cumplimiento-metas'),
                Api.get('/reportes/progreso-global'),
                Api.get('/reportes/rendimiento')
            ]);

            var avance = getResult(results[0]);
            var pendientes = getResult(results[1]);
            var completos = getResult(results[2]);
            var statsSimulacros = getResult(results[3]);
            var mejorSim = getResult(results[4]);
            var simRecientes = getResult(results[5]);
            var tiempoEstudio = getResult(results[6]);
            var comprension = getResult(results[7]);
            var bajaComprension = getResult(results[8]);
            var cumplMetas = getResult(results[9]);
            var progresoGlobal = getResult(results[10]);
            var rendimiento = getResult(results[11]);

            // 10.1 Avance por curso
            html += renderReporte('10.1 Porcentaje de Avance por Curso', function () {
                if (!avance || avance.length === 0) return '<p style="color: var(--text-muted);">Sin datos</p>';
                var t = '<table class="data-table"><thead><tr><th>Curso</th><th>Total Temas</th><th>Dominados</th><th>Avance</th></tr></thead><tbody>';
                avance.forEach(function (r) {
                    t += '<tr><td>' + escapeHtml(r.curso) + '</td><td>' + r.total_temas + '</td><td>' + (r.temas_dominados || 0) + '</td><td><span style="color:var(--dorado-400);font-weight:700;">' + (parseFloat(r.porcentaje_avance) || 0).toFixed(1) + '%</span></td></tr>';
                });
                t += '</tbody></table>';
                return t;
            });

            // 10.2 Temas pendientes
            html += renderReporte('10.2 Temas Pendientes o por Reforzar', function () {
                if (!pendientes || pendientes.length === 0) return '<p style="color: var(--text-muted);">Todos los temas estan al dia</p>';
                var t = '<table class="data-table"><thead><tr><th>Curso</th><th>Tema</th><th>Estado</th></tr></thead><tbody>';
                pendientes.forEach(function (r) {
                    t += '<tr><td>' + escapeHtml(r.curso) + '</td><td>' + escapeHtml(r.tema) + '</td><td><span class="badge ' + getBadgeClass(r.estado) + '">' + r.estado + '</span></td></tr>';
                });
                t += '</tbody></table>';
                return t;
            });

            // 10.4 Cursos completos
            html += renderReporte('10.4 Cursos Completados al 100%', function () {
                if (!completos || completos.length === 0) return '<p style="color: var(--text-muted);">Ningun curso completado aun</p>';
                var t = '';
                completos.forEach(function (r) {
                    t += '<div style="padding:8px 0;border-bottom:1px solid var(--border-color);"><span style="color:var(--success);font-weight:600;">' + escapeHtml(r.curso) + '</span></div>';
                });
                return t;
            });

            // 10.6 Estadisticas simulacros
            html += renderReporte('10.6 Estadisticas de Simulacros', function () {
                if (!statsSimulacros) return '<p style="color: var(--text-muted);">Sin datos</p>';
                var s = statsSimulacros;
                return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
                    '<div><span style="font-size:12px;color:var(--text-muted);">Total</span><br><span style="font-size:20px;font-weight:700;color:var(--text-primary);">' + (s.total_simulacros || 0) + '</span></div>' +
                    '<div><span style="font-size:12px;color:var(--text-muted);">Promedio</span><br><span style="font-size:20px;font-weight:700;color:var(--dorado-400);">' + (s.promedio || 0) + '</span></div>' +
                    '<div><span style="font-size:12px;color:var(--text-muted);">Mejor</span><br><span style="font-size:20px;font-weight:700;color:var(--success);">' + (s.mejor_puntaje || '-') + '</span></div>' +
                    '<div><span style="font-size:12px;color:var(--text-muted);">Peor</span><br><span style="font-size:20px;font-weight:700;color:var(--danger);">' + (s.peor_puntaje || '-') + '</span></div>' +
                    '</div>';
            });

            // 10.8 Mejor simulacro
            html += renderReporte('10.8 Mejor Simulacro', function () {
                if (!mejorSim || mejorSim.length === 0) return '<p style="color: var(--text-muted);">Sin datos</p>';
                var m = mejorSim[0];
                var fecha = new Date(m.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
                return '<div style="text-align:center;padding:12px 0;"><span style="font-size:36px;font-weight:800;color:var(--dorado-400);">' + m.puntaje + '</span><br><span style="color:var(--text-muted);font-size:13px;">puntos - ' + fecha + '</span></div>';
            });

            // 10.7 Simulacros recientes
            html += renderReporte('10.7 Simulacros Ultimos 30 Dias', function () {
                if (!simRecientes || simRecientes.length === 0) return '<p style="color: var(--text-muted);">Sin simulacros recientes</p>';
                var t = '<table class="data-table"><thead><tr><th>Fecha</th><th>Puntaje</th></tr></thead><tbody>';
                simRecientes.forEach(function (r) {
                    var f = new Date(r.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
                    t += '<tr><td>' + f + '</td><td style="font-weight:700;color:var(--dorado-400);">' + r.puntaje + '</td></tr>';
                });
                t += '</tbody></table>';
                return t;
            });

            // 10.12 Tiempo estudio por curso
            html += renderReporte('10.12 Tiempo de Estudio por Curso', function () {
                if (!tiempoEstudio || tiempoEstudio.length === 0) return '<p style="color: var(--text-muted);">Sin datos de sesiones</p>';
                var t = '<table class="data-table"><thead><tr><th>Curso</th><th>Tiempo Total</th></tr></thead><tbody>';
                tiempoEstudio.forEach(function (r) {
                    t += '<tr><td>' + escapeHtml(r.curso) + '</td><td style="font-weight:600;color:var(--text-primary);">' + (r.tiempo_total || '00:00:00') + '</td></tr>';
                });
                t += '</tbody></table>';
                return t;
            });

            // 10.13 Comprension por tema
            html += renderReporte('10.13 Comprension Promedio por Tema', function () {
                if (!comprension || comprension.length === 0) return '<p style="color: var(--text-muted);">Sin datos</p>';
                var t = '<table class="data-table"><thead><tr><th>Tema</th><th>Comprension</th></tr></thead><tbody>';
                comprension.forEach(function (r) {
                    var val = parseFloat(r.comprension_promedio) || 0;
                    var color = val >= 4 ? 'var(--success)' : val >= 3 ? 'var(--dorado-400)' : 'var(--danger)';
                    t += '<tr><td>' + escapeHtml(r.tema) + '</td><td style="font-weight:700;color:' + color + ';">' + val.toFixed(1) + ' / 5</td></tr>';
                });
                t += '</tbody></table>';
                return t;
            });

            // 10.14 Baja comprension
            html += renderReporte('10.14 Temas con Baja Comprension (< 3)', function () {
                if (!bajaComprension || bajaComprension.length === 0) return '<p style="color: var(--success);">Todos los temas tienen buena comprension</p>';
                var t = '<table class="data-table"><thead><tr><th>Tema</th><th>Comprension</th></tr></thead><tbody>';
                bajaComprension.forEach(function (r) {
                    t += '<tr><td>' + escapeHtml(r.tema) + '</td><td style="font-weight:700;color:var(--danger);">' + (parseFloat(r.comprension_promedio) || 0).toFixed(1) + ' / 5</td></tr>';
                });
                t += '</tbody></table>';
                return t;
            });

            // 10.15 Cumplimiento metas
            html += renderReporte('10.15 Cumplimiento de Metas', function () {
                if (!cumplMetas || cumplMetas.length === 0) return '<p style="color: var(--text-muted);">Sin metas</p>';
                var t = '';
                cumplMetas.forEach(function (r) {
                    t += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-color);">';
                    t += '<span class="badge ' + getBadgeClass(r.estado) + '">' + r.estado + '</span>';
                    t += '<span style="font-size:20px;font-weight:700;color:var(--text-primary);">' + r.cantidad + '</span>';
                    t += '</div>';
                });
                return t;
            });

            // 10.17 Progreso global
            html += renderReporte('10.17 Progreso Global', function () {
                if (!progresoGlobal || progresoGlobal.length === 0) return '<p style="color: var(--text-muted);">Sin datos</p>';
                var t = '<table class="data-table"><thead><tr><th>Nombre</th><th>Avance</th></tr></thead><tbody>';
                progresoGlobal.forEach(function (r) {
                    var pct = parseFloat(r.porcentaje_avance) || 0;
                    t += '<tr><td>' + escapeHtml(r.nombre) + '</td><td style="font-weight:700;color:var(--dorado-400);">' + pct.toFixed(1) + '%</td></tr>';
                });
                t += '</tbody></table>';
                return t;
            });

            // Vista rendimiento
            html += renderReporte('Vista de Rendimiento', function () {
                if (!rendimiento || rendimiento.length === 0) return '<p style="color: var(--text-muted);">Sin datos</p>';
                var t = '<table class="data-table"><thead><tr><th>Nombre</th><th>Curso</th><th>Total Temas</th><th>Dominados</th></tr></thead><tbody>';
                rendimiento.forEach(function (r) {
                    t += '<tr><td>' + escapeHtml(r.nombre) + '</td><td>' + escapeHtml(r.curso) + '</td><td>' + r.total_temas + '</td><td style="font-weight:700;color:var(--success);">' + (r.dominados || 0) + '</td></tr>';
                });
                t += '</tbody></table>';
                return t;
            });

            html += '</div>'; // reportes-grid

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar reportes</p></div>';
        }
    }

    function renderReporte(title, contentFn) {
        return '<div class="reporte-card">' +
            '<div class="reporte-card-header"><span class="reporte-card-title">' + title + '</span></div>' +
            '<div class="reporte-card-body">' + contentFn() + '</div>' +
            '</div>';
    }

    function getResult(promiseResult) {
        if (promiseResult.status === 'fulfilled') return promiseResult.value;
        return null;
    }

    return {
        render: render
    };
})();
