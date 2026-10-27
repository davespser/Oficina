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
    'box-shadow:0 12px 40px rgba(0,0,0,.45);' +
    'font-family:system-ui,sans-serif';

  const header = document.createElement('div');
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;' +
    'gap:12px;margin-bottom:20px';

  const title = document.createElement('h2');
  title.textContent = 'ESPACIO DE TRABAJO';
  title.style.cssText =
    'margin:0;font-size:20px;color:#ffd39a';

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Cerrar';
  close.style.cssText =
    'padding:9px 13px;border:1px solid #426a91;' +
    'border-radius:8px;background:#101d30;color:#e6f2ff;' +
    'font-size:14px;cursor:pointer';

  const content = document.createElement('div');
  content.style.cssText = 'line-height:1.6';

  header.append(title, close);
  panel.append(header, content);
  document.body.appendChild(panel);

  let requestNumber = 0;

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

      if (!response.ok) {
        throw new Error('No se pudo leer el catálogo.');
      }

      const filenames = await response.json();

      if (currentRequest !== requestNumber) return;

      if (!Array.isArray(filenames) || filenames.length === 0) {
        showMessage(
          'Todavía no hay dibujos. Copia imágenes PNG, JPG, WEBP, GIF o AVIF ' +
          'a public/dibujos/ y vuelve a abrir esta sección.'
        );
        return;
      }

      content.replaceChildren();

      const gallery = document.createElement('div');
      gallery.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));' +
        'gap:14px';

      for (const filename of filenames) {
        if (typeof filename !== 'string' || filename.includes('/') ||
            filename.includes('\\') || filename === '.' || filename === '..') {
          continue;
        }

        const card = document.createElement('article');
        card.style.cssText =
          'min-width:0;overflow:hidden;border:1px solid #29435f;' +
          'border-radius:10px;background:#0b1423';

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

        card.append(image, caption);
        gallery.appendChild(card);
      }

      if (!gallery.children.length) {
        showMessage('No se encontraron nombres de imagen válidos en el catálogo.');
        return;
      }

      content.appendChild(gallery);
    } catch (error) {
      if (currentRequest !== requestNumber) return;

      showMessage(
        'No se pudo cargar el catálogo. Comprueba que existe ' +
        'public/dibujos/manifest.json y vuelve a iniciar la aplicación.'
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
      showMessage(`El espacio de ${name.toLowerCase()} está preparado.`);
    }
  }

  function hide() {
    requestNumber++;
    panel.hidden = true;
  }

  close.addEventListener('click', hide);

  return { panel, open, hide };
}
