/* ========================================
   Monitor BD Module - Demostracion en vivo
   Muestra el estado actual de cada tabla de la base de datos para el
   usuario logueado y se auto-refresca. Al agregar o eliminar algo en
   la app, las filas nuevas se resaltan en verde y el progreso recalculado
   por el trigger parpadea, para verlo cambiar en tiempo real.
   ======================================== */
var MonitorModule = (function () {

    var intervalId = null;          // temporizador del auto-refresco
    var autoRefresh = true;         // estado del interruptor
    var prevIds = {};               // ids vistos en el refresco anterior (por tabla)
    var prevProgreso = null;        // ultimo porcentaje, para detectar cambios

    // Orden y etiquetas amigables de las tablas a mostrar
    var TABLAS = [
        { key: 'curso',      label: 'curso',      pk: 'id_curso' },
        { key: 'tema',       label: 'tema',       pk: 'id_tema' },
        { key: 'simulacro',  label: 'simulacro',  pk: 'id_simulacro' },
        { key: 'horario',    label: 'horario',    pk: 'id_horario' },
        { key: 'meta',       label: 'meta',       pk: 'id_meta' },
        { key: 'sesion',     label: 'sesion',     pk: 'id_sesion' },
        { key: 'documento',  label: 'documento',  pk: 'id_documento' },
        { key: 'flashcard',  label: 'flashcard',  pk: 'id_flashcard' }
    ];

    // Inyectar una sola vez los estilos propios del monitor
    function ensureStyles() {
        if (document.getElementById('monitor-styles')) return;
        var style = document.createElement('style');
        style.id = 'monitor-styles';
        style.textContent = [
            '@keyframes monitorFlash { 0% { background: rgba(46,204,113,0.55); } 100% { background: transparent; } }',
            '.monitor-row-new { animation: monitorFlash 2.2s ease-out; }',
            '.monitor-progreso-flash { animation: monitorFlash 2.2s ease-out; border-radius: 8px; }',
            '.monitor-table-wrap { margin-bottom: 22px; }',
            '.monitor-table-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }',
            '.monitor-table-title { font-weight:700; color:var(--text-primary); font-size:14px; }',
            '.monitor-table-title code { color:var(--dorado-400); }',
            '.monitor-count { font-size:12px; color:var(--text-muted); }',
            '.monitor-scroll { overflow-x:auto; border:1px solid var(--border-color); border-radius:8px; }',
            '.monitor-empty { font-size:13px; color:var(--text-muted); padding:10px; }',
            '.monitor-summary { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; }',
            '.monitor-chip { background:var(--bg-secondary,#1b1b1f); border:1px solid var(--border-color); border-radius:10px; padding:8px 14px; min-width:96px; }',
            '.monitor-chip-label { font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.4px; }',
            '.monitor-chip-value { font-size:20px; font-weight:800; color:var(--text-primary); }',
            '.monitor-progreso { font-size:42px; font-weight:800; color:var(--dorado-400); line-height:1; }'
        ].join('\n');
        document.head.appendChild(style);
    }

    async function render() {
        ensureStyles();
        prevIds = {};
        prevProgreso = null;

        var container = document.getElementById('page-content');
        container.innerHTML =
            '<div id="monitor-root">' +
            '  <div class="page-header">' +
            '    <div>' +
            '      <h1>Monitor de Base de Datos</h1>' +
            '      <p class="page-header-subtitle">Estado en vivo de cada tabla. Agrega o elimina datos en otra pestana y observa los cambios aqui.</p>' +
            '    </div>' +
            '    <div style="display:flex; gap:10px; align-items:center;">' +
            '      <label style="display:flex; gap:6px; align-items:center; font-size:13px; color:var(--text-secondary); cursor:pointer;">' +
            '        <input type="checkbox" id="monitor-auto" ' + (autoRefresh ? 'checked' : '') + ' onchange="MonitorModule.toggleAuto(this.checked)"> Auto-refresco (2s)' +
            '      </label>' +
            '      <button class="btn btn-gold" onclick="MonitorModule.refresh()">Refrescar ahora</button>' +
            '    </div>' +
            '  </div>' +
            '  <div id="monitor-meta" style="font-size:12px; color:var(--text-muted); margin-bottom:14px;"></div>' +
            '  <div id="monitor-body"><div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando estado de la base de datos...</p></div></div>' +
            '</div>';

        await refresh();
        startInterval();
    }

    function startInterval() {
        stop();
        if (autoRefresh) {
            intervalId = setInterval(refresh, 2000);
        }
    }

    // Detener el auto-refresco (lo llama App.navigate al salir de esta pagina)
    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function toggleAuto(checked) {
        autoRefresh = checked;
        startInterval();
    }

    async function refresh() {
        // Si el usuario navego a otra pagina, detenerse para no pisar su contenido
        if (!document.getElementById('monitor-root')) {
            stop();
            return;
        }
        try {
            var data = await Api.get('/monitor');
            paint(data);
        } catch (error) {
            var body = document.getElementById('monitor-body');
            if (body) body.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al leer la base de datos</p><p class="empty-state-desc">' + escapeHtml(error.message) + '</p></div>';
        }
    }

    function paint(data) {
        var meta = document.getElementById('monitor-meta');
        var body = document.getElementById('monitor-body');
        if (!meta || !body) return;

        var hora = new Date(data.timestamp).toLocaleTimeString('es-PE');
        meta.textContent = 'Usuario: ' + (data.usuario ? data.usuario.nombre : '-') +
            '  |  Ultima lectura: ' + hora;

        var progValor = data.progreso ? parseFloat(data.progreso.porcentaje_av) : 0;
        var progCambio = (prevProgreso !== null && prevProgreso !== progValor);

        var html = '';

        // Tarjeta de progreso (lo recalcula el trigger trg_actualiza_progreso)
        html += '<div class="monitor-summary">';
        html += '  <div class="monitor-chip' + (progCambio ? ' monitor-progreso-flash' : '') + '" style="min-width:160px;">';
        html += '    <div class="monitor-chip-label">progreso.porcentaje_av</div>';
        html += '    <div class="monitor-progreso">' + progValor.toFixed(2) + '%</div>';
        html += '    <div class="monitor-chip-label" style="margin-top:4px;">lo actualiza el trigger</div>';
        html += '  </div>';

        // Chips con el conteo de filas de cada tabla
        TABLAS.forEach(function (t) {
            var rows = data.tablas[t.key] || [];
            html += '<div class="monitor-chip">';
            html += '  <div class="monitor-chip-label">' + t.label + '</div>';
            html += '  <div class="monitor-chip-value">' + rows.length + '</div>';
            html += '</div>';
        });
        html += '</div>';

        // Una tabla por cada entidad
        TABLAS.forEach(function (t) {
            var rows = data.tablas[t.key] || [];
            html += renderTabla(t, rows);
        });

        body.innerHTML = html;
        prevProgreso = progValor;
    }

    function renderTabla(t, rows) {
        var html = '<div class="monitor-table-wrap">';
        html += '  <div class="monitor-table-head">';
        html += '    <span class="monitor-table-title">Tabla <code>' + t.label + '</code></span>';
        html += '    <span class="monitor-count">' + rows.length + ' fila' + (rows.length === 1 ? '' : 's') + '</span>';
        html += '  </div>';

        if (rows.length === 0) {
            html += '  <div class="monitor-scroll"><div class="monitor-empty">Sin registros.</div></div>';
            html += '</div>';
            // Reiniciar el set de ids para esta tabla
            prevIds[t.key] = {};
            return html;
        }

        var cols = Object.keys(rows[0]);
        var seen = prevIds[t.key] || null;   // null la primera vez (no resaltar todo al entrar)
        var nowIds = {};

        html += '  <div class="monitor-scroll"><table class="data-table" style="width:100%;"><thead><tr>';
        cols.forEach(function (c) { html += '<th>' + escapeHtml(c) + '</th>'; });
        html += '</tr></thead><tbody>';

        rows.forEach(function (row) {
            var pkVal = String(row[t.pk]);
            nowIds[pkVal] = true;
            var esNueva = seen && !seen[pkVal];   // apareci ahora y no estaba antes
            html += '<tr class="' + (esNueva ? 'monitor-row-new' : '') + '">';
            cols.forEach(function (c) {
                var val = row[c];
                html += '<td>' + escapeHtml(val === null ? 'NULL' : String(val)) + '</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div></div>';
        prevIds[t.key] = nowIds;
        return html;
    }

    return {
        render: render,
        refresh: refresh,
        stop: stop,
        toggleAuto: toggleAuto
    };
})();
