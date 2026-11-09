export function createContentPanel() {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'Panel de trabajo');
  panel.hidden = true;

  panel.style.cssText =
    'position:fixed;left:5%;top:8%;width:90%;height:84%;' +
    'z-index:20;box-sizing:border-box;overflow:auto;' +
    'padding:22px;border:1px solid #426a91;border-radius:14px;' +
    'background:linear-gradient(145deg,rgba(14,24,42,.98),' +
    'rgba(5,10,22,.98));color:#e6f2ff;' +
    'box-shadow:0 12px 40px rgba(0,0,0,.45);font-family:system-ui,sans-serif';

  const header = document.createElement('div');
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;' +
    'gap:12px;margin-bottom:20px';

  const title = document.createElement('h2');
  title.textContent = 'ESPACIO DE TRABAJO';
  title.style.cssText = 'margin:0;font-size:20px;color:#ffd39a';

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Cerrar';
  close.style.cssText =
    'padding:9px 13px;border:1px solid #426a91;border-radius:8px;' +
    'background:#101d30;color:#e6f2ff;font-size:14px;cursor:pointer';

  const content = document.createElement('div');
  content.style.cssText = 'line-height:1.6';

  // Reproductor persistente: no pertenece al contenido que se reemplaza.
  const musicAudioDock = document.createElement('div');
  musicAudioDock.hidden = true;
  musicAudioDock.style.cssText =
    'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);' +
    'width:90%;max-width:560px;box-sizing:border-box;padding:10px;' +
    'z-index:45;border:1px solid #426a91;border-radius:12px;' +
    'background:rgba(5,10,22,.97);box-shadow:0 8px 30px rgba(0,0,0,.5)';

  header.append(title, close);
  panel.append(header, content);
  document.body.appendChild(panel);
  document.body.appendChild(musicAudioDock);

  // Visor ampliado de imágenes.
  const viewer = document.createElement('div');
  viewer.style.cssText =
    'position:fixed;inset:0;z-index:50;display:none;' +
    'flex-direction:column;align-items:center;justify-content:center;' +
    'gap:14px;padding:18px;box-sizing:border-box;' +
    'background:rgba(2,5,13,.97);color:#e6f2ff;' +
    'font-family:system-ui,sans-serif';

  const viewerHeader = document.createElement('div');
  viewerHeader.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;' +
    'gap:12px;width:100%;max-width:1000px';

  const filenameLabel = document.createElement('div');
  filenameLabel.style.cssText =
    'font-size:14px;overflow-wrap:anywhere;flex:1;min-width:0';

  const viewerClose = document.createElement('button');
  viewerClose.type = 'button';
  viewerClose.textContent = 'Volver a dibujos';
  viewerClose.style.cssText =
    'padding:10px 12px;border:1px solid #426a91;border-radius:8px;' +
    'background:#101d30;color:#e6f2ff;cursor:pointer;flex-shrink:0';

  const largeImage = document.createElement('img');
  largeImage.alt = '';
  largeImage.style.cssText =
    'display:block;max-width:100%;width:auto;height:auto;' +
    'max-height:calc(100dvh - 150px);object-fit:contain;' +
    'border-radius:6px';

  const navigation = document.createElement('div');
  navigation.style.cssText = 'display:flex;gap:14px;align-items:center';

  function makeButton(label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText =
      'padding:10px 16px;border:1px solid #426a91;border-radius:8px;' +
      'background:#101d30;color:#e6f2ff;font-size:14px;cursor:pointer';
    return button;
  }

  const previous = makeButton('← Anterior');
  const next = makeButton('Siguiente →');

  navigation.append(previous, next);
  viewerHeader.append(filenameLabel, viewerClose);
  viewer.append(viewerHeader, largeImage, navigation);
  document.body.appendChild(viewer);

  let requestNumber = 0;
  let chatPollingTimer = null;
  let filenames = [];
  let currentIndex = 0;

  function closeViewer() {
    viewer.style.display = 'none';
    largeImage.removeAttribute('src');
  }

  function showImage(index) {
    if (!filenames.length) return;

    currentIndex = (index + filenames.length) % filenames.length;
    const filename = filenames[currentIndex];

    filenameLabel.textContent = filename;
    largeImage.alt = filename;
    largeImage.src = import.meta.env.BASE_URL + 'dibujos/' + encodeURIComponent(filename);
  }

  function openViewer(filename) {
    const index = filenames.indexOf(filename);
    if (index < 0) return;

    showImage(index);
    viewer.style.display = 'flex';
  }

  previous.addEventListener('click', () => showImage(currentIndex - 1));
  next.addEventListener('click', () => showImage(currentIndex + 1));
  viewerClose.addEventListener('click', closeViewer);

  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) closeViewer();
  });

  function showMessage(text) {
    content.replaceChildren();
    const message = document.createElement('p');
    message.textContent = text;
    content.appendChild(message);
  }

  function showCopilot(currentRequest) {
    if (currentRequest !== requestNumber) return;

    clearTimeout(chatPollingTimer);
    chatPollingTimer = null;

    content.replaceChildren();

    const heading = document.createElement('h3');
    heading.textContent = 'CODEX · MEMORIA DE TRABAJO';
    heading.style.cssText = 'color:#83cfff;margin:0 0 12px';

    const status = document.createElement('p');
    status.textContent = 'Conectando con Codex...';

    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px';

    const conversationSelect = document.createElement('select');
    conversationSelect.setAttribute('aria-label', 'Conversación activa');
    conversationSelect.style.cssText =
      'flex:1 1 190px;min-width:0;padding:9px;border:1px solid #426a91;' +
      'border-radius:8px;background:#101d30;color:#e6f2ff';

    function toolbarButton(label) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.style.cssText =
        'flex:1 1 auto;min-height:38px;padding:8px 11px;border:1px solid #426a91;' +
        'border-radius:8px;background:#101d30;color:#e6f2ff;cursor:pointer';
      return button;
    }

    const newConversation = toolbarButton('＋ Nueva conversación');
    const archiveConversation = toolbarButton('Archivar');
    const deleteConversation = toolbarButton('Eliminar');
    toolbar.append(
      conversationSelect,
      newConversation,
      archiveConversation,
      deleteConversation
    );

    const archivedDetails = document.createElement('details');
    archivedDetails.style.cssText =
      'margin:0 0 12px;padding:9px 11px;border:1px solid #29435f;' +
      'border-radius:8px;background:#0b1423';
    const archivedSummary = document.createElement('summary');
    archivedSummary.textContent = 'Conversaciones archivadas';
    archivedSummary.style.cssText = 'cursor:pointer;color:#ffd39a';
    const archivedList = document.createElement('div');
    archivedList.style.cssText = 'display:grid;gap:8px;margin-top:10px';
    archivedDetails.append(archivedSummary, archivedList);

    const memoryDetails = document.createElement('details');
    memoryDetails.style.cssText =
      'margin:0 0 12px;padding:9px 11px;border:1px solid #29435f;' +
      'border-radius:8px;background:#0b1423';
    const memorySummary = document.createElement('summary');
    memorySummary.textContent = 'Memoria de trabajo persistente';
    memorySummary.style.cssText = 'cursor:pointer;color:#ffd39a';
    const memoryForm = document.createElement('form');
    memoryForm.style.cssText = 'display:grid;gap:8px;margin-top:10px';
    const memoryInput = document.createElement('textarea');
    memoryInput.rows = 4;
    memoryInput.maxLength = 12000;
    memoryInput.placeholder = 'Decisiones, configuraciones, contexto de proyecto y tareas pendientes que deberían acompañar conversaciones nuevas.';
    memoryInput.style.cssText =
      'width:100%;box-sizing:border-box;resize:vertical;padding:10px;' +
      'border:1px solid #29435f;border-radius:8px;background:#080f1c;' +
      'color:#e6f2ff;line-height:1.5';
    const saveMemory = toolbarButton('Guardar memoria');
    saveMemory.style.justifySelf = 'start';
    memoryForm.append(memoryInput, saveMemory);
    memoryDetails.append(memorySummary, memoryForm);

    const history = document.createElement('div');
    history.style.cssText =
      'height:48vh;overflow-y:auto;padding:10px;' +
      'background:#080f1c;border:1px solid #29435f;' +
      'border-radius:10px;margin-bottom:12px';

    const form = document.createElement('form');
    form.style.cssText = 'display:flex;gap:8px';

    const input = document.createElement('textarea');
    input.placeholder = 'Escribe a Codex...';
    input.rows = 2;
    input.style.cssText =
      'flex:1;min-width:0;resize:vertical;padding:12px;' +
      'border-radius:8px;background:#101d30;color:white';

    const send = document.createElement('button');
    send.type = 'submit';
    send.textContent = 'ENVIAR';
    send.style.cssText =
      'padding:10px 14px;border-radius:8px;' +
      'background:#16446a;color:white;border:1px solid #72cfff';

    let activeTask = null;
    let selectedConversation = null;
    let loadedConversations = [];
    let memoryLoaded = false;
    let memoryEdited = false;

    memoryInput.addEventListener('input', () => {
      memoryEdited = true;
    });

    function addMessage(label, value, isError = false) {
      const item = document.createElement('p');
      item.style.cssText =
        'white-space:pre-wrap;overflow-wrap:anywhere;' +
        'padding:10px;margin:8px 0;border-radius:8px;' +
        (isError ? 'background:rgba(105,35,42,.42);' :
          'background:rgba(40,70,100,.35);');
      item.textContent = label + ': ' + value;
      history.appendChild(item);
      return item;
    }

    function appendStoredImage(image) {
      if (!image?.url) return;

      const figure = document.createElement('figure');
      figure.style.cssText =
        'margin:12px 0;padding:10px;background:#101d30;' +
        'border:1px solid #416b91;border-radius:12px;';

      const img = document.createElement('img');
      img.src = image.url;
      img.alt = 'Imagen original generada por FLUX';
      img.loading = 'lazy';
      img.style.cssText =
        'display:block;width:100%;height:auto;border-radius:8px;';

      const caption = document.createElement('figcaption');
      caption.textContent = 'FLUX · ' + (image.filename || 'Imagen generada');
      caption.style.cssText = 'color:#83cfff;padding-top:8px;';
      figure.append(img, caption);
      history.appendChild(figure);
    }

    function scheduleHistoryRefresh() {
      clearTimeout(chatPollingTimer);
      chatPollingTimer = setTimeout(() => {
        void fetchConversationData(true);
      }, 1800);
    }

    async function fetchConversationData(isPolling = false) {
      try {
        const conversationResponse = await fetch('/api/conversations', { cache: 'no-store' });
        const result = await conversationResponse.json();
        if (!conversationResponse.ok) {
          throw new Error(result.error || 'No se pudieron recuperar las conversaciones.');
        }
        if (currentRequest !== requestNumber) return;

        if (!memoryLoaded) {
          const memoryResponse = await fetch('/api/work-memory', { cache: 'no-store' });
          const memory = await memoryResponse.json();
          if (!memoryResponse.ok) throw new Error(memory.error || 'No se pudo leer la memoria.');
          if (!memoryEdited) memoryInput.value = typeof memory.content === 'string' ? memory.content : '';
          memoryLoaded = true;
        }

        loadedConversations = result.conversations || [];
        const conversation = result.activeConversation;
        selectedConversation = conversation;
        const activeId = result.activeConversationId || '';

        conversationSelect.replaceChildren();
        const activeConversations = loadedConversations.filter(item => item.status === 'active');
        if (!activeConversations.length) {
          const emptyOption = document.createElement('option');
          emptyOption.value = '';
          emptyOption.textContent = 'Sin conversación activa';
          conversationSelect.appendChild(emptyOption);
        }
        for (const item of activeConversations) {
          const option = document.createElement('option');
          option.value = item.id;
          option.textContent = item.title || 'Conversación';
          option.selected = item.id === activeId;
          conversationSelect.appendChild(option);
        }

        const archived = loadedConversations.filter(item => item.status === 'archived');
        archivedSummary.textContent = `Conversaciones archivadas (${archived.length})`;
        archivedList.replaceChildren();
        for (const item of archived) {
          const row = document.createElement('div');
          row.style.cssText =
            'display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding-top:7px';
          const name = document.createElement('span');
          name.textContent = item.title || 'Conversación archivada';
          name.style.cssText = 'flex:1 1 150px;overflow-wrap:anywhere;color:#e6f2ff';
          const restore = toolbarButton('Recuperar');
          const erase = toolbarButton('Eliminar');
          restore.addEventListener('click', async () => {
            await conversationAction(`/api/conversations/${encodeURIComponent(item.id)}/restore`, 'POST');
          });
          erase.addEventListener('click', async () => {
            if (!confirm(`¿Eliminar definitivamente “${item.title}” y su hilo de Codex?`)) return;
            await conversationAction(`/api/conversations/${encodeURIComponent(item.id)}`, 'DELETE');
          });
          row.append(name, restore, erase);
          archivedList.appendChild(row);
        }

        const hasConversation = Boolean(conversation);
        archiveConversation.disabled = !hasConversation || Boolean(conversation?.activeTask);
        deleteConversation.disabled = !hasConversation || Boolean(conversation?.activeTask);
        conversationSelect.disabled = activeConversations.length < 2;
        input.disabled = !hasConversation || Boolean(conversation?.activeTask);
        send.disabled = input.disabled;

        history.replaceChildren();
        if (!conversation) {
          const empty = document.createElement('p');
          empty.textContent = 'Crea una conversación para empezar. Las conversaciones nuevas reciben solo la memoria de trabajo guardada.';
          history.appendChild(empty);
        } else {
          const title = document.createElement('h4');
          title.textContent = conversation.title || 'Conversación';
          title.style.cssText = 'margin:0 0 10px;color:#ffd39a';
          history.appendChild(title);

          if (conversation.summary) {
            const summary = document.createElement('details');
            summary.style.cssText =
              'margin:0 0 12px;padding:9px;border:1px solid #29435f;' +
              'border-radius:8px;background:#0b1423';
            const summaryTitle = document.createElement('summary');
            summaryTitle.textContent = 'Resumen de decisiones, avances y pendientes';
            summaryTitle.style.cssText = 'cursor:pointer;color:#83cfff';
            const summaryText = document.createElement('p');
            summaryText.textContent = conversation.summary;
            summaryText.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere';
            summary.append(summaryTitle, summaryText);
            history.appendChild(summary);
          }
        }

        for (const item of conversation?.messages || []) {
          const label = item.role === 'user'
            ? 'TÚ'
            : item.error ? 'CODEX · ERROR' : 'CODEX';
          addMessage(label, item.content || '', Boolean(item.error));
          appendStoredImage(item.image);
        }

        activeTask = ['running', 'summarizing'].includes(conversation?.activeTask?.status)
          ? conversation.activeTask
          : null;

        if (activeTask) {
          status.textContent = activeTask.status === 'summarizing'
            ? 'Codex está guardando un resumen de la conversación…'
            : 'Codex sigue trabajando; el resultado se guardará aquí.';
          input.disabled = true;
          send.disabled = true;
          scheduleHistoryRefresh();
        } else {
          const latestTask = conversation?.tasks?.at(-1);
          status.textContent = ['failed', 'interrupted'].includes(latestTask?.status)
            ? `La última tarea terminó con error: ${latestTask.error || 'error desconocido'}`
            : 'Conversación guardada · memoria separada';
          input.disabled = !hasConversation;
          send.disabled = !hasConversation;
          clearTimeout(chatPollingTimer);
          chatPollingTimer = null;
        }
        history.scrollTop = history.scrollHeight;
      } catch (error) {
        if (currentRequest !== requestNumber) return;
        status.textContent = isPolling
          ? 'Reconectando con el historial…'
          : 'No se pudo cargar la conversación guardada.';
        if (isPolling || activeTask) scheduleHistoryRefresh();
      }
    }

    async function conversationAction(url, method) {
      try {
        const response = await fetch(url, { method });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo completar la acción.');
        await fetchConversationData();
      } catch (error) {
        alert(error.message);
      }
    }

    newConversation.addEventListener('click', async () => {
      newConversation.disabled = true;
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo crear la conversación.');
        await fetchConversationData();
        input.focus();
      } catch (error) {
        alert(error.message);
      } finally {
        newConversation.disabled = false;
      }
    });

    conversationSelect.addEventListener('change', async () => {
      if (!conversationSelect.value) return;
      await conversationAction(
        `/api/conversations/${encodeURIComponent(conversationSelect.value)}/activate`,
        'POST'
      );
    });

    archiveConversation.addEventListener('click', async () => {
      if (!selectedConversation) return;
      await conversationAction(
        `/api/conversations/${encodeURIComponent(selectedConversation.id)}/archive`,
        'POST'
      );
    });

    deleteConversation.addEventListener('click', async () => {
      if (!selectedConversation) return;
      if (!confirm(`¿Eliminar definitivamente “${selectedConversation.title}” y su hilo de Codex?`)) return;
      await conversationAction(
        `/api/conversations/${encodeURIComponent(selectedConversation.id)}`,
        'DELETE'
      );
    });

    memoryForm.addEventListener('submit', async event => {
      event.preventDefault();
      saveMemory.disabled = true;
      try {
        const response = await fetch('/api/work-memory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: memoryInput.value })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo guardar la memoria.');
        memoryEdited = false;
        status.textContent = 'Memoria de trabajo guardada';
      } catch (error) {
        alert(error.message);
      } finally {
        saveMemory.disabled = false;
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;

      input.value = '';
      input.disabled = true;
      send.disabled = true;
      addMessage('TÚ', message);
      status.textContent = 'Codex está pensando...';

      const clientMessageId = globalThis.crypto?.randomUUID?.() ||
        `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const conversationId = selectedConversation?.id;
      if (!conversationId) {
        input.disabled = false;
        send.disabled = false;
        return;
      }

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, clientMessageId, conversationId })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Error de Codex');
        await fetchConversationData();
      } catch {
        // The server may still be completing the task after the mobile browser
        // drops this request. Restore authoritative state instead of appending
        // a second local error/message that could duplicate on resume.
        await fetchConversationData(true);
      } finally {
        if (currentRequest === requestNumber && !activeTask) {
          input.disabled = false;
          send.disabled = false;
          input.focus();
        }
      }
    });

    form.append(input, send);
    content.append(
      heading,
      toolbar,
      archivedDetails,
      memoryDetails,
      status,
      history,
      form
    );

    void fetchConversationData();

    fetch('/api/health')
      .then(response => response.json())
      .then(result => {
        if (currentRequest === requestNumber && !activeTask) {
          status.textContent = result.ok
            ? 'Conversación guardada · Codex conectado'
            : 'Codex no está disponible';
        }
      })
      .catch(() => {
        if (!activeTask) status.textContent = 'No se puede conectar con Codex';
      });
  }

  async function showDrawings(currentRequest) {
    showMessage('Cargando catálogo de imágenes…');

    try {
      const response = await fetch(import.meta.env.BASE_URL + 'dibujos/manifest.json', {
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('No se pudo leer el catálogo.');

      const result = await response.json();

      if (currentRequest !== requestNumber) return;

      filenames = Array.isArray(result)
        ? result.filter((name) =>
            typeof name === 'string' &&
            !name.includes('/') &&
            !name.includes('\\') &&
            name !== '.' &&
            name !== '..'
          )
        : [];

      if (!filenames.length) {
        showMessage(
          'Todavía no hay dibujos. Copia imágenes a public/dibujos/ ' +
          'y regenera el catálogo.'
        );
        return;
      }

      content.replaceChildren();

      const gallery = document.createElement('div');
      gallery.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));' +
        'gap:14px';

      for (const filename of filenames) {
        const card = document.createElement('article');
        card.style.cssText =
          'min-width:0;overflow:hidden;border:1px solid #29435f;' +
          'border-radius:10px;background:#0b1423;cursor:pointer';

        const image = document.createElement('img');
        image.src = import.meta.env.BASE_URL + 'dibujos/' + encodeURIComponent(filename);
        image.alt = filename;
        image.loading = 'lazy';
        image.style.cssText =
          'display:block;width:100%;height:150px;object-fit:contain;' +
          'background:#070c16';

        image.addEventListener('error', () => {
          image.alt = 'No se pudo cargar esta imagen';
          image.style.display = 'none';

          const error = document.createElement('p');
          error.textContent = 'No se pudo cargar la imagen.';
          error.style.cssText = 'padding:8px;margin:0;color:#ffb6a8';
          card.prepend(error);
        }, { once: true });

        const caption = document.createElement('p');
        caption.textContent = filename;
        caption.title = filename;
        caption.style.cssText =
          'padding:10px;margin:0;font-size:13px;overflow-wrap:anywhere';

        card.addEventListener('click', () => openViewer(filename));

        const actions = document.createElement('div');
        actions.style.cssText =
          'display:flex;flex-wrap:wrap;gap:6px;padding:0 8px 9px;';

        const renameButton = document.createElement('button');
        renameButton.type = 'button';
        renameButton.textContent = 'RENOMBRAR';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'BORRAR';

        for (const button of [renameButton, deleteButton]) {
          button.style.cssText =
            'flex:1 1 76px;min-width:0;min-height:38px;padding:7px 4px;' +
            'white-space:normal;overflow-wrap:anywhere;line-height:1.2;' +
            'border-radius:7px;' +
            'border:1px solid #426a91;background:#101d30;' +
            'color:#e6f2ff;font-size:11px;cursor:pointer;';
          button.addEventListener('click', event => event.stopPropagation());
        }
        renameButton.setAttribute('aria-label', `Renombrar ${filename}`);
        deleteButton.setAttribute('aria-label', `Borrar ${filename}`);

        renameButton.addEventListener('click', async () => {
          const extension = filename.slice(filename.lastIndexOf('.'));
          const currentName = filename.slice(0, -extension.length);
          const newName = prompt('Nuevo nombre (sin extensión):', currentName);

          if (newName === null || !newName.trim()) return;

          renameButton.disabled = true;

          try {
            const response = await fetch('/api/drawings/rename', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename, newName: newName.trim() })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al renombrar.');

            closeViewer();
            await showDrawings(currentRequest);
          } catch (error) {
            alert(error.message);
            renameButton.disabled = false;
          }
        });

        deleteButton.addEventListener('click', async () => {
          if (!confirm('¿Borrar definitivamente esta imagen?')) return;

          deleteButton.disabled = true;

          try {
            const response = await fetch('/api/drawings/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al borrar.');

            closeViewer();
            await showDrawings(currentRequest);
          } catch (error) {
            alert(error.message);
            deleteButton.disabled = false;
          }
        });

        actions.append(renameButton, deleteButton);
        card.append(image, caption, actions);
        gallery.appendChild(card);
      }

      content.appendChild(gallery);
    } catch (error) {
      if (currentRequest !== requestNumber) return;

      showMessage(
        'No se pudo cargar el catálogo. Comprueba manifest.json ' +
        'y vuelve a intentarlo.'
      );
      console.error(error);
    }
  }


  let musicTracks = [];
  let musicIndex = -1;
  let musicAudio = null;
  let musicAudioEventsInstalled = false;
  let musicStatus = null;
  let musicTrackLabel = null;
  let musicPlayButton = null;

  function updateMusicStatus(text) {
    if (musicStatus) musicStatus.textContent = text;
  }

  function updateMusicTrackLabel() {
    if (!musicTrackLabel) return;
    musicTrackLabel.textContent = musicIndex >= 0
      ? musicTracks[musicIndex]
      : 'Ninguna pista seleccionada';
  }

  function selectMusicTrack(index, autoplay = true) {
    if (!musicTracks.length || !musicAudio) return;

    musicIndex = (index + musicTracks.length) % musicTracks.length;
    const filename = musicTracks[musicIndex];

    musicAudio.src = import.meta.env.BASE_URL + 'assets/music/' + encodeURIComponent(filename);
    musicAudio.load();
    updateMusicTrackLabel();
    updateMusicStatus('Pista seleccionada');

    if (autoplay) {
      musicAudio.play().then(() => {
        updateMusicStatus('Reproduciendo');
      }).catch((error) => {
        updateMusicStatus(
          error.name === 'NotAllowedError'
            ? 'Pulsa reproducir para comenzar'
            : 'No se pudo reproducir. Comprueba el formato del archivo.'
        );
      });
    }
  }

  async function showMusic(currentRequest) {
    showMessage('Cargando catálogo musical…');

    try {
      const response = await fetch(import.meta.env.BASE_URL + 'assets/music/manifest.json', {
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('No se pudo leer el catálogo musical.');

      const result = await response.json();
      if (currentRequest !== requestNumber) return;

      musicTracks = Array.isArray(result)
        ? result.filter((name) =>
            typeof name === 'string' &&
            !name.includes('/') &&
            !name.includes('\\') &&
            name !== '.' &&
            name !== '..' &&
            /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba|webm)$/i.test(name)
          )
        : [];

      content.replaceChildren();

      const intro = document.createElement('p');
      intro.textContent =
        'TU BIBLIOTECA SONORA · Selecciona una pista y escucha desde tu oficina.';
      intro.style.cssText = 'margin:0 0 18px;color:#9ccfff';
      content.appendChild(intro);

      if (!musicTracks.length) {
        const empty = document.createElement('p');
        empty.textContent =
          'Todavía no hay canciones. Añade archivos MP3, WAV, OGG o M4A ' +
          'a public/assets/music/ y vuelve a abrir MÚSICA.';
        empty.style.cssText =
          'padding:18px;border:1px solid #29435f;border-radius:10px;' +
          'background:#0b1423;line-height:1.7';
        content.appendChild(empty);
        return;
      }

      const player = document.createElement('section');
      player.style.cssText =
        'padding:18px;margin-bottom:20px;border:1px solid #1765a0;' +
        'border-radius:12px;background:linear-gradient(145deg,#101f35,#070d19)';

      const playerTitle = document.createElement('h3');
      playerTitle.textContent = 'REPRODUCTOR';
      playerTitle.style.cssText =
        'margin:0 0 8px;color:#ffd39a;font-size:15px;letter-spacing:1px';

      musicTrackLabel = document.createElement('p');
      musicTrackLabel.textContent = 'Ninguna pista seleccionada';
      musicTrackLabel.style.cssText =
        'margin:0 0 14px;overflow-wrap:anywhere;color:#e6f2ff';

      musicStatus = document.createElement('p');
      musicStatus.textContent = 'Selecciona una canción de la lista';
      musicStatus.style.cssText =
        'margin:0 0 12px;font-size:13px;color:#83cfff';

      if (!musicAudio) {
        musicAudio = document.createElement('audio');
        musicAudio.controls = true;
        musicAudio.preload = 'metadata';
        musicAudio.style.cssText =
          'display:block;width:100%;max-width:100%';
        musicAudioDock.appendChild(musicAudio);
      }

      musicAudioDock.hidden = false;

      const controls = document.createElement('div');
      controls.style.cssText =
        'display:flex;flex-wrap:wrap;gap:10px;margin-top:14px';

      function musicButton(label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.style.cssText =
          'padding:10px 14px;border:1px solid #426a91;border-radius:8px;' +
          'background:#101d30;color:#e6f2ff;cursor:pointer;font-size:14px';
        return button;
      }

      const previousTrack = musicButton('⏮ Anterior');
      musicPlayButton = musicButton('▶ Reproducir');
      const nextTrack = musicButton('Siguiente ⏭');

      previousTrack.addEventListener('click', () => {
        selectMusicTrack(musicIndex - 1);
      });

      nextTrack.addEventListener('click', () => {
        selectMusicTrack(musicIndex + 1);
      });

      musicPlayButton.addEventListener('click', () => {
        if (musicIndex < 0) {
          selectMusicTrack(0);
          return;
        }

        if (musicAudio.paused) {
          musicAudio.play().then(() => {
            updateMusicStatus('Reproduciendo');
          }).catch(() => {
            updateMusicStatus('No se pudo iniciar la reproducción.');
          });
        } else {
          musicAudio.pause();
        }
      });

      if (!musicAudioEventsInstalled) {
        musicAudio.addEventListener('play', () => {
          updateMusicStatus('Reproduciendo');
          if (musicPlayButton) musicPlayButton.textContent = '⏸ Pausar';
        });

        musicAudio.addEventListener('pause', () => {
          if (musicPlayButton) musicPlayButton.textContent = '▶ Reproducir';
          if (musicAudio.currentTime > 0 && !musicAudio.ended) {
            updateMusicStatus('En pausa');
          }
        });

        musicAudio.addEventListener('ended', () => {
          if (musicTracks.length > 1) {
            selectMusicTrack(musicIndex + 1);
          } else {
            updateMusicStatus('Reproducción finalizada');
          }
        });

        musicAudio.addEventListener('error', () => {
          updateMusicStatus(
            'Error al cargar el audio. Comprueba el archivo y su formato.'
          );
        });

        musicAudioEventsInstalled = true;
      }

      controls.append(previousTrack, musicPlayButton, nextTrack);
      player.append(
        playerTitle,
        musicTrackLabel,
        musicStatus,
        controls
      );
      content.appendChild(player);

      const listTitle = document.createElement('h3');
      listTitle.textContent = 'LISTA DE CANCIONES · ' + musicTracks.length;
      listTitle.style.cssText =
        'margin:0 0 12px;color:#ffd39a;font-size:15px;letter-spacing:1px';
      content.appendChild(listTitle);

      const playlist = document.createElement('div');
      playlist.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px';

      musicTracks.forEach((filename, index) => {
        const trackButton = document.createElement('button');
        trackButton.type = 'button';
        trackButton.textContent = '♫  ' + filename;
        trackButton.title = filename;
        trackButton.style.cssText =
          'min-width:0;padding:14px;text-align:left;overflow-wrap:anywhere;' +
          'border:1px solid #29435f;border-radius:9px;' +
          'background:#0b1423;color:#e6f2ff;cursor:pointer;line-height:1.5';

        trackButton.addEventListener('click', () => {
          selectMusicTrack(index);
        });

        playlist.appendChild(trackButton);
      });

      content.appendChild(playlist);
    } catch (error) {
      if (currentRequest !== requestNumber) return;

      showMessage(
        'No se pudo cargar el catálogo musical. Vuelve a abrir MÚSICA ' +
        'y comprueba que exista assets/music/manifest.json.'
      );
      console.error(error);
    }
  }

  function open(name) {
    const currentRequest = ++requestNumber;
    if (name !== 'COPILOT') {
      clearTimeout(chatPollingTimer);
      chatPollingTimer = null;
    }
    title.textContent = name;
    panel.hidden = false;

    if (name === 'DIBUJOS') {
      void showDrawings(currentRequest);
    } else if (name === 'MÚSICA') {
      closeViewer();
      void showMusic(currentRequest);
    } else if (name === 'COPILOT') {
      closeViewer();
      showCopilot(currentRequest);
    } else {
      closeViewer();
      showMessage(`El espacio de ${name.toLowerCase()} está preparado.`);
    }
  }

  function hide() {
    requestNumber++;
    clearTimeout(chatPollingTimer);
    chatPollingTimer = null;
    closeViewer();
    panel.hidden = true;
  }

  close.addEventListener('click', hide);

  document.addEventListener('keydown', (event) => {
    if (viewer.style.display !== 'flex') return;

    if (event.key === 'Escape') closeViewer();
    if (event.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (event.key === 'ArrowRight') showImage(currentIndex + 1);
  });

  return { panel, open, hide };
}
