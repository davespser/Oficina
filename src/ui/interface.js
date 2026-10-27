export function createInterface() {
  const backendLabel = document.createElement('div');

  backendLabel.style.cssText =
    'position:fixed;top:12px;left:12px;z-index:10;' +
    'padding:8px 11px;border:1px solid #1765a0;border-radius:8px;' +
    'font:12px monospace;color:#83cfff;background:rgba(3,6,17,.88);' +
    'pointer-events:none';

  backendLabel.textContent = 'INICIALIZANDO WEBGPU';
  document.body.appendChild(backendLabel);

  const message = document.createElement('div');

  message.style.cssText =
    'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);' +
    'z-index:10;padding:12px 18px;border:1px solid #168cff;' +
    'border-radius:12px;background:rgba(3,10,27,.94);color:#d9efff;' +
    'font:14px monospace;text-align:center;max-width:85%;' +
    'pointer-events:none;opacity:0;transition:opacity .2s';

  document.body.appendChild(message);

  return { backendLabel, message };
}
