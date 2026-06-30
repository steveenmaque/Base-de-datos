/* ========================================
   Flashcards Module - Tarjetas de estudio
   ======================================== */
var FlashcardsModule = (function () {
    var currentCards = [];
    var currentIndex = 0;
    var currentTemaId = null;

    async function render() {
        var container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">Cargando flashcards...</p></div>';

        try {
            var fcData = await Api.get('/reportes/flashcards-por-tema');

            var html = '';
            html += '<div class="page-header">';
            html += '  <div>';
            html += '    <h1>Flashcards</h1>';
            html += '    <p class="page-header-subtitle">Tarjetas de estudio para repasar conceptos clave</p>';
            html += '  </div>';
            html += '  <button class="btn btn-gold" onclick="FlashcardsModule.openAdd()">+ Nueva Flashcard</button>';
            html += '</div>';

            if (fcData.length > 0) {
                html += '<div class="cursos-grid">';
                fcData.forEach(function (item) {
                    html += '<div class="curso-card" onclick="FlashcardsModule.openStudy(' + (item.id_tema || 0) + ', \'' + escapeHtml(item.tema).replace(/'/g, "\\'") + '\')" style="cursor: pointer;">';
                    html += '  <div class="curso-card-header">';
                    html += '    <span class="curso-card-name">' + escapeHtml(item.tema) + '</span>';
                    html += '    <span class="badge badge-estudiado">' + item.total_flashcards + ' tarjetas</span>';
                    html += '  </div>';
                    html += '  <p style="font-size: 13px; color: var(--text-muted);">Haz clic para estudiar estas flashcards</p>';
                    html += '</div>';
                });
                html += '</div>';
            } else {
                html += '<div class="empty-state">';
                html += '  <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
                html += '  <p class="empty-state-title">No hay flashcards registradas</p>';
                html += '  <p class="empty-state-desc">Crea flashcards por tema para repasar de forma interactiva.</p>';
                html += '</div>';
            }

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error al cargar flashcards</p></div>';
        }
    }

    async function openStudy(idTema, temaNombre) {
        if (!idTema) return;
        currentTemaId = idTema;
        currentIndex = 0;

        try {
            currentCards = await Api.get('/flashcards/tema/' + idTema);
        } catch (e) {
            currentCards = [];
        }

        if (currentCards.length === 0) {
            App.toast('Este tema no tiene flashcards', 'info');
            return;
        }

        renderStudyView(temaNombre);
    }

    function renderStudyView(temaNombre) {
        var container = document.getElementById('page-content');
        var card = currentCards[currentIndex];

        var html = '';
        html += '<div class="page-header">';
        html += '  <div>';
        html += '    <h1>Estudiando: ' + escapeHtml(temaNombre) + '</h1>';
        html += '    <p class="page-header-subtitle">Haz clic en la tarjeta para ver la respuesta</p>';
        html += '  </div>';
        html += '  <button class="btn btn-outline" onclick="FlashcardsModule.render()">Volver a la lista</button>';
        html += '</div>';

        html += '<div class="flashcard-container">';
        html += '  <div class="flashcard-wrapper" id="flashcard-wrapper" onclick="FlashcardsModule.flipCard()">';
        html += '    <div class="flashcard-inner">';
        html += '      <div class="flashcard-front">';
        html += '        <span class="flashcard-label">Pregunta</span>';
        html += '        <p class="flashcard-text">' + escapeHtml(card.pregunta) + '</p>';
        html += '        <span class="flashcard-hint">Clic para ver respuesta</span>';
        html += '      </div>';
        html += '      <div class="flashcard-back">';
        html += '        <span class="flashcard-label">Respuesta</span>';
        html += '        <p class="flashcard-text">' + escapeHtml(card.respuesta) + '</p>';
        html += '        <span class="flashcard-hint">Clic para ver pregunta</span>';
        html += '      </div>';
        html += '    </div>';
        html += '  </div>';

        html += '  <div class="flashcard-nav">';
        html += '    <button class="btn btn-outline" onclick="FlashcardsModule.prevCard(\'' + escapeHtml(temaNombre).replace(/'/g, "\\'") + '\')"' + (currentIndex === 0 ? ' disabled style="opacity:0.4;pointer-events:none;"' : '') + '>Anterior</button>';
        html += '    <span class="flashcard-counter">' + (currentIndex + 1) + ' / ' + currentCards.length + '</span>';
        html += '    <button class="btn btn-primary" onclick="FlashcardsModule.nextCard(\'' + escapeHtml(temaNombre).replace(/'/g, "\\'") + '\')"' + (currentIndex === currentCards.length - 1 ? ' disabled style="opacity:0.4;pointer-events:none;"' : '') + '>Siguiente</button>';
        html += '  </div>';

        // Botones para eliminar la flashcard actual
        html += '  <button class="btn btn-sm btn-danger" onclick="FlashcardsModule.removeCard(' + card.id_flashcard + ', \'' + escapeHtml(temaNombre).replace(/'/g, "\\'") + '\')">Eliminar esta flashcard</button>';

        html += '</div>';

        container.innerHTML = html;
    }

    function flipCard() {
        var wrapper = document.getElementById('flashcard-wrapper');
        if (wrapper) {
            wrapper.classList.toggle('flipped');
        }
    }

    function nextCard(temaNombre) {
        if (currentIndex < currentCards.length - 1) {
            currentIndex++;
            renderStudyView(temaNombre);
        }
    }

    function prevCard(temaNombre) {
        if (currentIndex > 0) {
            currentIndex--;
            renderStudyView(temaNombre);
        }
    }

    async function removeCard(id, temaNombre) {
        if (!confirm('Estas seguro de eliminar esta flashcard?')) return;
        try {
            await Api.del('/flashcards/' + id);
            currentCards = currentCards.filter(function (c) { return c.id_flashcard !== id; });
            if (currentCards.length === 0) {
                App.toast('Flashcard eliminada. No quedan mas tarjetas.', 'success');
                render();
                return;
            }
            if (currentIndex >= currentCards.length) currentIndex = currentCards.length - 1;
            App.toast('Flashcard eliminada', 'success');
            renderStudyView(temaNombre);
        } catch (error) { App.toast(error.message, 'error'); }
    }

    async function openAdd() {
        var cursos = [];
        try { cursos = await Api.get('/cursos'); } catch (e) { /* sin cursos */ }

        var body = '';
        body += '<form onsubmit="FlashcardsModule.add(event)">';
        body += '  <div class="form-group"><label for="fc-curso">Curso</label>';
        body += '    <select id="fc-curso" onchange="FlashcardsModule.loadTemas(this.value)" required>';
        body += '      <option value="">Selecciona un curso</option>';
        cursos.forEach(function (c) {
            body += '<option value="' + c.id_curso + '">' + escapeHtml(c.nombre) + '</option>';
        });
        body += '    </select></div>';
        body += '  <div class="form-group"><label for="fc-tema">Tema</label>';
        body += '    <select id="fc-tema" required><option value="">Primero selecciona un curso</option></select></div>';
        body += '  <div class="form-group"><label for="fc-pregunta">Pregunta</label><textarea id="fc-pregunta" placeholder="Escribe la pregunta" required></textarea></div>';
        body += '  <div class="form-group"><label for="fc-respuesta">Respuesta</label><textarea id="fc-respuesta" placeholder="Escribe la respuesta" required></textarea></div>';
        body += '  <div class="modal-actions">';
        body += '    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>';
        body += '    <button type="submit" class="btn btn-gold">Crear Flashcard</button>';
        body += '  </div>';
        body += '</form>';
        App.openModal('Nueva Flashcard', body);
    }

    async function loadTemas(idCurso) {
        var select = document.getElementById('fc-tema');
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
            id_tema: parseInt(document.getElementById('fc-tema').value),
            pregunta: document.getElementById('fc-pregunta').value.trim(),
            respuesta: document.getElementById('fc-respuesta').value.trim()
        };
        if (!data.id_tema) {
            App.toast('Selecciona un tema', 'error');
            return;
        }
        try {
            await Api.post('/flashcards', data);
            App.closeModal();
            App.toast('Flashcard creada correctamente', 'success');
            render();
        } catch (error) { App.toast(error.message, 'error'); }
    }

    return {
        render: render,
        openStudy: openStudy,
        flipCard: flipCard,
        nextCard: nextCard,
        prevCard: prevCard,
        removeCard: removeCard,
        openAdd: openAdd,
        loadTemas: loadTemas,
        add: add
    };
})();
