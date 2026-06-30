/* ========================================
   Horarios Module - Horario Semanal
   ======================================== */
var HorariosModule = (function () {
    var DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando horario...</p></div>';

        try {
            var horarios = await Api.get('/horarios');

            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Horario de Estudio</h1>';
            html += '    <p class="page-header-subtitle">Organiza tus bloques de estudio durante la semana</p>';
            html += '  </div>';
            html += '  <button class="btn btn-gold" onclick="HorariosModule.openAdd()">+ Nuevo Bloque</button>';
            html += '</div>';

            // Agrupar por dia
            var porDia = {};
            DIAS.forEach(function (d) { porDia[d] = []; });
            horarios.forEach(function (h) {
                var dia = h.dia;
                if (porDia[dia]) {
                    porDia[dia].push(h);
                }
            });

            html += '<div class="horario-grid">';
            DIAS.forEach(function (dia) {
                html += '<div class="horario-day">';
                html += '  <div class="horario-day-name">' + dia.substring(0, 3) + '</div>';
                if (porDia[dia].length > 0) {
                    porDia[dia].forEach(function (h) {
                        var horaStr = h.hora ? h.hora.substring(0, 5) : '';
                        html += '<div class="horario-block">';
                        html += '  <span>' + horaStr + '</span>';
                        html += '  <button class="btn-delete-sm" onclick="HorariosModule.remove(' + h.id_horario + ')" title="Eliminar">&times;</button>';
                        html += '</div>';
                    });
                } else {
                    html += '<p style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 8px 0;">Sin bloques</p>';
                }
                html += '</div>';
            });
            html += '</div>';

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar horarios</p></div>';
        }
    }

    function openAdd() {
        var body = '';
        body += '<form onsubmit="HorariosModule.add(event)">';
        body += '  <div class="form-row">';
        body += '    <div class="form-group"><label for="hor-dia">Dia</label>';
        body += '      <select id="hor-dia" required>';
        DIAS.forEach(function (d) {
            body += '<option value="' + d + '">' + d + '</option>';
        });
        body += '      </select>';
        body += '    </div>';
        body += '    <div class="form-group"><label for="hor-hora">Hora</label><input type="time" id="hor-hora" required></div>';
        body += '  </div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Agregar</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Nuevo Bloque de Estudio', body);
    }

    async function add(event) {
        event.preventDefault();
        var data = {
            dia: document.getElementById('hor-dia').value,
            hora: document.getElementById('hor-hora').value
        };
        try {
            await Api.post('/horarios', data);
            App.closeModal();
            App.toast('Bloque de horario agregado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    async function remove(id) {
        try {
            await Api.del('/horarios/' + id);
            App.toast('Bloque eliminado', 'success');
            render();
        } catch (error) {
            App.toast(error.message, 'error');
        }
    }

    return {
        render: render,
        openAdd: openAdd,
        add: add,
        remove: remove
    };
})();
