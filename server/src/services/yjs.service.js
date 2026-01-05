/**
 * Yjs Persistence Service
 * Handles document persistence using LevelDB
 * Ensures no data loss on server restart
 */

const Y = require('yjs');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

// Try to load LevelDB persistence, but make it optional
// Use a function to lazy-load it only when needed
// We need to intercept the require to prevent leveldown from loading
function getLeveldbPersistence() {
  if (getLeveldbPersistence._cached !== undefined) {
    return getLeveldbPersistence._cached;
  }
  
  // Clear require cache for y-leveldb and leveldown to avoid cached errors
  const Module = require('module');
  const cacheKeys = Object.keys(Module._cache).filter(key => 
    key.includes('y-leveldb') || key.includes('leveldown')
  );
  cacheKeys.forEach(key => delete Module._cache[key]);
  
  try {
    // Try to require y-leveldb
    const yLeveldb = require('y-leveldb');
    getLeveldbPersistence._cached = yLeveldb.LeveldbPersistence;
    return getLeveldbPersistence._cached;
  } catch (error) {
    getLeveldbPersistence._cached = null;
    // Only log if it's not the expected leveldown error
    if (!error.message.includes('leveldown') && !error.message.includes('No native build')) {
      console.warn('⚠️  y-leveldb not available, persistence will be disabled');
      console.warn('⚠️  Error:', error.message);
    }
    return null;
  }
}
getLeveldbPersistence._cached = undefined;

class YjsService {
  constructor() {
    this.persistence = null;
    this.docs = new Map(); // roomId -> Y.Doc
    this.initialized = false;
  }

  /**
   * Initialize persistence layer
   */
  async initialize() {
    if (this.initialized) return;

    // Try to get LevelDB persistence (lazy load)
    const LeveldbPersistenceClass = getLeveldbPersistence();
    
    // If LevelDB is not available, skip persistence
    if (!LeveldbPersistenceClass) {
      if (!this._warned) {
        console.log('⚠️  LevelDB persistence not available, using in-memory only');
        console.log('⚠️  Data will be lost on server restart');
        this._warned = true;
      }
      this.persistence = null;
      this.initialized = true;
      return;
    }

    try {
      // Ensure persistence directory exists
      const persistDir = path.resolve(config.yjs.persistenceDir);
      if (!fs.existsSync(persistDir)) {
        fs.mkdirSync(persistDir, { recursive: true });
      }

      this.persistence = new LeveldbPersistenceClass(persistDir);
      this.initialized = true;
      console.log('✅ Yjs LevelDB persistence initialized at:', persistDir);
    } catch (error) {
      console.error('❌ Failed to initialize Yjs persistence:', error.message);
      console.log('⚠️  Continuing without persistence (in-memory only)');
      console.log('⚠️  Data will be lost on server restart');
      // Continue without persistence - in-memory only
      this.persistence = null;
      this.initialized = true;
    }
  }

  /**
   * Get or create a Yjs document for a room
   */
  async getDocument(roomId) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Return cached document if exists
    if (this.docs.has(roomId)) {
      return this.docs.get(roomId);
    }

    // Create new document
    const doc = new Y.Doc();

    // Bind to persistence
    if (this.persistence) {
      await this.persistence.bindState(roomId, doc);
    }

    // Initialize default structure if document is empty
    this.initializeDocStructure(doc, roomId);

    // Cache document
    this.docs.set(roomId, doc);

    // Set up auto-save on updates (only if persistence is available)
    if (this.persistence) {
      doc.on('update', async (update, origin) => {
        if (origin !== 'persistence') {
          try {
            await this.persistence.storeUpdate(roomId, update);
          } catch (error) {
            console.error(`Failed to persist update for room ${roomId}:`, error.message);
          }
        }
      });
    }

    return doc;
  }

  /**
   * Initialize document structure for new rooms
   */
  initializeDocStructure(doc, roomId) {
    // Only initialize if document is empty
    const files = doc.getMap('files');
    const metadata = doc.getMap('metadata');

    if (files.size === 0) {
      // Create default file
      const defaultFileId = 'main';
      const fileContent = doc.getText(`file:${defaultFileId}`);
      
      if (fileContent.length === 0) {
        fileContent.insert(0, '// Welcome to Codeverse!\n// Start coding here...\n\nconsole.log("Hello, World!");\n');
      }

      files.set(defaultFileId, {
        id: defaultFileId,
        name: 'main.js',
        language: 'javascript',
        createdAt: Date.now(),
      });

      // Set active file
      metadata.set('activeFileId', defaultFileId);
    }

    // Initialize metadata if needed
    if (!metadata.has('createdAt')) {
      metadata.set('createdAt', Date.now());
      metadata.set('roomId', roomId);
    }
  }

  /**
   * Get file content from document
   */
  getFileContent(doc, fileId) {
    return doc.getText(`file:${fileId}`);
  }

  /**
   * Create a new file in the document
   */
  createFile(doc, fileId, name, language, initialContent = '') {
    const files = doc.getMap('files');
    
    if (files.has(fileId)) {
      throw new Error('File already exists');
    }

    // Create file metadata
    files.set(fileId, {
      id: fileId,
      name,
      language,
      createdAt: Date.now(),
    });

    // Create file content
    const content = doc.getText(`file:${fileId}`);
    if (initialContent) {
      content.insert(0, initialContent);
    }

    return { id: fileId, name, language };
  }

  /**
   * Delete a file from the document
   */
  deleteFile(doc, fileId) {
    const files = doc.getMap('files');
    const metadata = doc.getMap('metadata');

    if (!files.has(fileId)) {
      throw new Error('File not found');
    }

    // Don't delete the last file
    if (files.size <= 1) {
      throw new Error('Cannot delete the last file');
    }

    // Remove file metadata
    files.delete(fileId);

    // Clear file content (can't fully delete Y.Text, but can clear it)
    const content = doc.getText(`file:${fileId}`);
    content.delete(0, content.length);

    // Update active file if needed
    if (metadata.get('activeFileId') === fileId) {
      const remainingFiles = Array.from(files.keys());
      metadata.set('activeFileId', remainingFiles[0]);
    }
  }

  /**
   * Rename a file
   */
  renameFile(doc, fileId, newName) {
    const files = doc.getMap('files');
    const file = files.get(fileId);

    if (!file) {
      throw new Error('File not found');
    }

    files.set(fileId, {
      ...file,
      name: newName,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get all files in document
   */
  getFiles(doc) {
    const files = doc.getMap('files');
    return Array.from(files.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  /**
   * Clear document from memory (doesn't delete persistence)
   */
  async unloadDocument(roomId) {
    const doc = this.docs.get(roomId);
    if (doc) {
      doc.destroy();
      this.docs.delete(roomId);
    }
  }

  /**
   * Delete document from persistence
   */
  async deleteDocument(roomId) {
    await this.unloadDocument(roomId);
    if (this.persistence) {
      try {
        await this.persistence.clearDocument(roomId);
      } catch (error) {
        console.error(`Failed to clear document ${roomId} from persistence:`, error.message);
      }
    }
  }

  /**
   * Get document state as Uint8Array (for syncing)
   */
  getDocumentState(doc) {
    return Y.encodeStateAsUpdate(doc);
  }

  /**
   * Apply update to document
   */
  applyUpdate(doc, update) {
    Y.applyUpdate(doc, update);
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      loadedDocuments: this.docs.size,
      documentIds: Array.from(this.docs.keys()),
    };
  }

  /**
   * Cleanup - call on server shutdown
   */
  async shutdown() {
    console.log('Shutting down Yjs service...');
    
    // Destroy all documents
    for (const [roomId, doc] of this.docs.entries()) {
      doc.destroy();
    }
    this.docs.clear();

    // Close persistence
    if (this.persistence) {
      try {
        await this.persistence.destroy();
      } catch (error) {
        console.error('Error destroying persistence:', error.message);
      }
    }

    this.initialized = false;
    console.log('Yjs service shut down');
  }
}

// Singleton instance
const yjsService = new YjsService();

module.exports = yjsService;

