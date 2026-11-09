import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Oficina/',
server: {
host: '0.0.0.0',
port: 5173,
strictPort: true,
proxy: {
'/api': 'http://127.0.0.1:3001'
}
},
preview: {
host: '0.0.0.0',
port: 4173,
strictPort: true
}
});
