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

  header.append(title, close);
  panel.append(header, content);
  document.body.appendChild(panel);

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
    largeImage.src = '/dibujos/' + encodeURIComponent(filename);
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

  async function showDrawings(currentRequest) {
    showMessage('Cargando catálogo de imágenes…');

    try {
      const response = await fetch('/dibujos/manifest.json', {
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
        image.src = '/dibujos/' + encodeURIComponent(filename);
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

        card.append(image, caption);
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

  function open(name) {
    const currentRequest = ++requestNumber;
    title.textContent = name;
    panel.hidden = false;

    if (name === 'DIBUJOS') {
      void showDrawings(currentRequest);
    } else {
      closeViewer();
      showMessage(`El espacio de ${name.toLowerCase()} está preparado.`);
    }
  }

  function hide() {
    requestNumber++;
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
