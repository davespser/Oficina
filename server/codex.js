import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';

class CodexBridge extends EventEmitter {
constructor() {
super();
this.nextId = 1;
this.pending = new Map();
this.activeTurns = new Map();
this.resumedThreadIds = new Set();
this.threadFile = path.resolve('server/thread.json');
this.threadId = null;
this.ready = this.initialize();
}

send(message) {
if (!this.proc || !this.proc.stdin.writable) {
throw new Error('Codex no está disponible.');
}
this.proc.stdin.write(JSON.stringify(message) + '\n');
}

request(method, params = {}) {
const id = this.nextId++;

return new Promise((resolve, reject) => {
const timer = setTimeout(() => {
this.pending.delete(id);
      reject(new Error(`Tiempo agotado: ${method}`));
}, 30000);

this.pending.set(id, {
resolve: (value) => {
clearTimeout(timer);
resolve(value);
},
reject: (error) => {
clearTimeout(timer);
reject(error);
}
});

this.send({ method, id, params });
});
}

initialize() {
return new Promise((resolve, reject) => {
this.proc = spawn('codex', ['app-server', '--listen', 'stdio://'], {
cwd: process.cwd(),
stdio: ['pipe', 'pipe', 'inherit']
});

const rl = readline.createInterface({ input: this.proc.stdout });

rl.on('line', (line) => {
let msg;
try {
msg = JSON.parse(line);
} catch {
return;
}

if (msg.id !== undefined && this.pending.has(msg.id)) {
const pending = this.pending.get(msg.id);
this.pending.delete(msg.id);

if (msg.error) {
pending.reject(new Error(msg.error.message || 'Error Codex'));
} else {
pending.resolve(msg.result);
}
return;
}

if (msg.method === 'item/agentMessage/delta') {
const delta = msg.params?.delta || '';
const threadId = msg.params?.threadId || this.threadId;
const active = this.activeTurns.get(threadId);
if (active) {
active.text += delta;
this.emit('delta', delta);
}
}

if (msg.method === 'turn/completed') {
const turn = msg.params?.turn;
const threadId = msg.params?.threadId || this.threadId;
const active = this.activeTurns.get(threadId);
if (!active) return;
this.activeTurns.delete(threadId);

if (turn?.status === 'completed') {
active.resolve(active.text);
} else {
      active.reject(new Error(turn?.error?.message || `Turn ${turn?.status || 'fallido'}`));
}
}
});

this.proc.once('error', reject);

this.proc.once('exit', (code) => {
      const error = new Error(`Codex terminó con código ${code}`);
for (const pending of this.pending.values()) {
  pending.reject(error);
}
this.pending.clear();

for (const active of this.activeTurns.values()) {
active.reject(error);
}
this.activeTurns.clear();
});

this.request('initialize', {
clientInfo: {
name: 'oficina_virtual',
title: 'Oficina Virtual',
version: '1.0.0'
}
}).then(async () => {
this.send({ method: 'initialized', params: {} });

if (fs.existsSync(this.threadFile)) {
try {
      const saved = JSON.parse(fs.readFileSync(this.threadFile, 'utf8'));
      if (typeof saved.threadId !== 'string' || !saved.threadId) {
        throw new Error('El archivo de conversación de Codex no contiene un threadId válido.');
      }

      this.threadId = saved.threadId;
      await this.request('thread/resume', {
        threadId: this.threadId,
        excludeTurns: true,
        approvalPolicy: 'never',
        sandbox: 'danger-full-access'
      });
      this.resumedThreadIds.add(this.threadId);

      // Se desactiva la importación masiva del historial antiguo.
      // La conversación nueva se conserva en el historial local de la Oficina.
    } catch (error) {
      console.error('No se pudo recuperar el hilo principal de Codex:', error.message);
      this.resumedThreadIds.delete(this.threadId);
      this.threadId = null;
    }
}

if (!this.threadId) {
const result = await this.request('thread/start', {
cwd: process.cwd(),
approvalPolicy: 'never',
sandbox: 'danger-full-access'
});

this.threadId = result.thread.id;

fs.writeFileSync(
this.threadFile,
JSON.stringify({ threadId: this.threadId }, null, 2)
);
}

resolve();
}).catch(reject);
});
}

async startThread() {
await this.ready;
const result = await this.request('thread/start', {
cwd: process.cwd(),
approvalPolicy: 'never',
sandbox: 'danger-full-access'
});
const threadId = result?.thread?.id;
if (typeof threadId !== 'string' || !threadId) {
throw new Error('Codex no devolvió un identificador de conversación.');
}
this.resumedThreadIds.add(threadId);
return threadId;
}

async resumeThread(threadId) {
await this.ready;
if (this.resumedThreadIds.has(threadId)) return;
await this.request('thread/resume', {
threadId,
excludeTurns: true,
approvalPolicy: 'never',
sandbox: 'danger-full-access'
});
this.resumedThreadIds.add(threadId);
}

async archiveThread(threadId) {
await this.ready;
await this.request('thread/archive', { threadId });
this.resumedThreadIds.delete(threadId);
}

async restoreThread(threadId) {
await this.ready;
await this.request('thread/unarchive', { threadId });
this.resumedThreadIds.delete(threadId);
}

async deleteThread(threadId) {
await this.ready;
if (this.activeTurns.has(threadId)) {
throw new Error('No se puede eliminar una conversación mientras Codex trabaja.');
}

let replacementThreadId = null;
if (threadId === this.threadId) {
replacementThreadId = await this.startThread();
}

try {
await this.request('thread/delete', { threadId });
} catch (error) {
if (replacementThreadId) {
  await this.request('thread/delete', { threadId: replacementThreadId }).catch(() => {});
  this.resumedThreadIds.delete(replacementThreadId);
}
throw error;
}

this.resumedThreadIds.delete(threadId);
if (replacementThreadId) {
this.threadId = replacementThreadId;
fs.writeFileSync(
this.threadFile,
JSON.stringify({ threadId: replacementThreadId }, null, 2)
);
}
}

async summarizeText(text) {
const threadId = await this.startThread();
try {
return await this.chat(text, threadId);
} finally {
await this.deleteThread(threadId);
}
}

async chat(text, threadId = this.threadId) {
await this.ready;
if (typeof threadId !== 'string' || !threadId) {
throw new Error('La conversación de Codex no tiene un threadId.');
}
await this.resumeThread(threadId);

if (this.activeTurns.has(threadId)) {
throw new Error('Codex ya está trabajando en esta conversación.');
}

const completed = new Promise((resolve, reject) => {
this.activeTurns.set(threadId, { text: '', resolve, reject });
});

try {
await this.request('turn/start', {
threadId,
input: [{ type: 'text', text }]
});
} catch (error) {
const active = this.activeTurns.get(threadId);
if (active) {
active.reject(error);
this.activeTurns.delete(threadId);
}
throw error;
}

return completed;
}
}

export const codex = new CodexBridge();
