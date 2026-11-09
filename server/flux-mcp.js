import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { generateCloudflareImage } from './cloudflare-image.js';

const server = new McpServer({
  name: 'flux-oficina',
  version: '1.0.0'
});

server.tool(
  'generate_image',
  'Genera una imagen original mediante FLUX de Cloudflare y la guarda en la carpeta DIBUJOS de la Oficina.',
  {
    prompt: z.string().min(1).max(2048)
  },
  async ({ prompt }) => {
    try {
      const result = await generateCloudflareImage(prompt);
      return {
        content: [{
          type: 'text',
          text: `IMAGEN GENERADA: ${result.filename}\nRUTA: ${result.url}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: error.message }]
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
