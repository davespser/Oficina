import { readFile, mkdir, writeFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export async function generateCloudflareImage(prompt) {
  const configPath = resolve('.config/cloudflare.env');
  const configText = await readFile(configPath, 'utf8');
  const config = Object.fromEntries(
    configText.split('\n')
      .filter(line => line.includes('='))
      .map(line => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1).trim()];
      })
  );

  const account = config.CF_ACCOUNT_ID;
  const token = config.CF_API_TOKEN;

  if (!account || !token) {
    throw new Error('Faltan las credenciales de Cloudflare.');
  }

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${account}` +
    '/ai/run/@cf/black-forest-labs/flux-1-schnell';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      steps: 8
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success || !data.result?.image) {
    const detail = data.errors?.map(e => e.message).join('; ');
    throw new Error(detail || `Cloudflare respondió con error ${response.status}`);
  }

  const folder = resolve('public/dibujos');
  await mkdir(folder, { recursive: true });

  const filename = `lux-${Date.now()}-${randomUUID().slice(0, 8)}.jpg`;
  await writeFile(
    resolve(folder, filename),
    Buffer.from(data.result.image, 'base64')
  );

  await chmod(resolve(folder, filename), 0o644);

  return {
    filename,
    url: `/dibujos/${filename}`
  };
}
