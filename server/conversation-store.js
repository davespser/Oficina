import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const MAX_CONVERSATION_MESSAGES = 30;

export class ConversationStore {
  constructor(root = process.cwd()) {
    this.conversationsFile = path.join(root, 'server/conversations.json');
    this.legacyHistoryFile = path.join(root, 'server/chat-history.json');
    this.threadFile = path.join(root, 'server/thread.json');
    this.memoryFile = path.join(root, 'server/work-memory.json');
    this.initialization = null;
    this.storeQueue = Promise.resolve();
    this.memoryQueue = Promise.resolve();
  }

  async readJson(file) {
    try {
      const info = await fs.lstat(file);
      if (!info.isFile() || info.isSymbolicLink()) {
        throw new Error(`Archivo de datos inválido: ${path.basename(file)}`);
      }
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async writeJson(file, value) {
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n', {
        flag: 'wx',
        mode: 0o600
      });
      await fs.rename(temporary, file);
    } finally {
      await fs.unlink(temporary).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  async readLegacyHistory() {
    const legacy = await this.readJson(this.legacyHistoryFile);
    if (!legacy) return { messages: [], tasks: [], activeTaskId: null };
    if (!Array.isArray(legacy.messages) || !Array.isArray(legacy.tasks)) {
      throw new Error('El historial anterior de Codex tiene un formato inválido.');
    }
    return legacy;
  }

  async readLegacyThreadId() {
    const legacyThread = await this.readJson(this.threadFile);
    return typeof legacyThread?.threadId === 'string'
      ? legacyThread.threadId
      : null;
  }

  async ensure() {
    if (!this.initialization) {
      this.initialization = (async () => {
        const current = await this.readJson(this.conversationsFile);
        if (current) {
          if (!Array.isArray(current.conversations)) {
            throw new Error('El almacén de conversaciones tiene un formato inválido.');
          }
          return current;
        }

        const legacy = await this.readLegacyHistory();
        const now = new Date().toISOString();
        const conversationId = `legacy-${randomUUID()}`;
        const threadId = await this.readLegacyThreadId();
        const conversation = {
          id: conversationId,
          title: 'Conversación anterior',
          threadId,
          status: 'active',
          createdAt: legacy.messages[0]?.createdAt || now,
          updatedAt: legacy.messages.at(-1)?.createdAt || now,
          summary: '',
          summaryUpdatedAt: null,
          contextInitialized: true,
          messages: legacy.messages,
          tasks: legacy.tasks,
          activeTaskId: legacy.activeTaskId || null
        };

        const migrated = {
          version: 1,
          activeConversationId: conversationId,
          conversations: [conversation]
        };
        await this.writeJson(this.conversationsFile, migrated);
        return migrated;
      })().catch(error => {
        this.initialization = null;
        throw error;
      });
    }
    return this.initialization;
  }

  async get() {
    await this.ensure();
    await this.storeQueue;
    return this.readJson(this.conversationsFile);
  }

  mutate(update) {
    const operation = this.storeQueue.then(async () => {
      await this.ensure();
      const store = await this.readJson(this.conversationsFile);
      const result = await update(store);
      await this.writeJson(this.conversationsFile, store);
      return result;
    });
    this.storeQueue = operation.catch(() => {});
    return operation;
  }

  async getMemory() {
    const memory = await this.readJson(this.memoryFile);
    if (memory) {
      if (typeof memory.content !== 'string') {
        throw new Error('La memoria de trabajo tiene un formato inválido.');
      }
      return memory;
    }

    const empty = { version: 1, content: '', updatedAt: null };
    await this.writeJson(this.memoryFile, empty);
    return empty;
  }

  setMemory(content) {
    const operation = this.memoryQueue.then(async () => {
      const memory = {
        version: 1,
        content,
        updatedAt: new Date().toISOString()
      };
      await this.writeJson(this.memoryFile, memory);
      return memory;
    });
    this.memoryQueue = operation.catch(() => {});
    return operation;
  }
}
