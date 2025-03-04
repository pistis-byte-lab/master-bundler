"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheManager = exports.CacheManager = void 0;
exports.createCacheManager = createCacheManager;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
class CacheManager {
    constructor(options = {}) {
        var _a, _b, _c;
        this.memoryCache = new Map();
        this.options = {
            enabled: (_a = options.enabled) !== null && _a !== void 0 ? _a : true,
            directory: (_b = options.directory) !== null && _b !== void 0 ? _b : path_1.default.join(process.cwd(), '.cache'),
            ttl: (_c = options.ttl) !== null && _c !== void 0 ? _c : 24 * 60 * 60 * 1000, // 24 horas por padrão
        };
        // Criar diretório de cache se não existir
        if (this.options.enabled && !fs_1.default.existsSync(this.options.directory)) {
            try {
                fs_1.default.mkdirSync(this.options.directory, { recursive: true });
            }
            catch (error) {
                logger_1.logger.warning(`Não foi possível criar o diretório de cache: ${error}`);
                this.options.enabled = false;
            }
        }
    }
    generateKey(key) {
        return crypto_1.default.createHash('md5').update(key).digest('hex');
    }
    getCachePath(key) {
        const hashedKey = this.generateKey(key);
        return path_1.default.join(this.options.directory, `${hashedKey}.json`);
    }
    isExpired(timestamp) {
        if (!this.options.ttl)
            return false;
        return Date.now() - timestamp > this.options.ttl;
    }
    async dependenciesChanged(dependencies) {
        if (!dependencies || dependencies.length === 0)
            return false;
        for (const dep of dependencies) {
            try {
                const stats = await fs_1.default.promises.stat(dep);
                const cacheEntry = this.memoryCache.get(dep);
                if (!cacheEntry || stats.mtimeMs > cacheEntry.timestamp) {
                    return true;
                }
            }
            catch (error) {
                // Se não conseguimos verificar a dependência, assumimos que mudou
                return true;
            }
        }
        return false;
    }
    async get(key) {
        if (!this.options.enabled)
            return null;
        // Verificar cache em memória primeiro
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry) {
            if (!this.isExpired(memoryEntry.timestamp) &&
                !(await this.dependenciesChanged(memoryEntry.dependencies))) {
                return memoryEntry.data;
            }
            // Se expirou ou dependências mudaram, remover do cache em memória
            this.memoryCache.delete(key);
        }
        // Verificar cache em disco
        const cachePath = this.getCachePath(key);
        try {
            if (fs_1.default.existsSync(cachePath)) {
                const cacheData = await fs_1.default.promises.readFile(cachePath, 'utf-8');
                const cacheEntry = JSON.parse(cacheData);
                if (!this.isExpired(cacheEntry.timestamp) &&
                    !(await this.dependenciesChanged(cacheEntry.dependencies))) {
                    // Armazenar em cache de memória para acesso mais rápido
                    this.memoryCache.set(key, cacheEntry);
                    return cacheEntry.data;
                }
                // Se expirou ou dependências mudaram, remover do cache em disco
                await fs_1.default.promises.unlink(cachePath);
            }
        }
        catch (error) {
            logger_1.logger.warning(`Erro ao ler cache para chave ${key}: ${error}`);
        }
        return null;
    }
    async set(key, data, dependencies) {
        if (!this.options.enabled)
            return;
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            dependencies
        };
        // Armazenar em cache de memória
        this.memoryCache.set(key, cacheEntry);
        // Armazenar em cache de disco
        const cachePath = this.getCachePath(key);
        try {
            await fs_1.default.promises.writeFile(cachePath, JSON.stringify(cacheEntry), 'utf-8');
        }
        catch (error) {
            logger_1.logger.warning(`Erro ao escrever cache para chave ${key}: ${error}`);
        }
    }
    async invalidate(key) {
        if (!this.options.enabled)
            return;
        // Remover da memória
        this.memoryCache.delete(key);
        // Remover do disco
        const cachePath = this.getCachePath(key);
        try {
            if (fs_1.default.existsSync(cachePath)) {
                await fs_1.default.promises.unlink(cachePath);
            }
        }
        catch (error) {
            logger_1.logger.warning(`Erro ao invalidar cache para chave ${key}: ${error}`);
        }
    }
    async clear() {
        if (!this.options.enabled)
            return;
        // Limpar cache de memória
        this.memoryCache.clear();
        // Limpar cache de disco
        try {
            const files = await fs_1.default.promises.readdir(this.options.directory);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    await fs_1.default.promises.unlink(path_1.default.join(this.options.directory, file));
                }
            }
        }
        catch (error) {
            logger_1.logger.warning(`Erro ao limpar cache: ${error}`);
        }
    }
}
exports.CacheManager = CacheManager;
// Exportar uma instância padrão
exports.cacheManager = new CacheManager();
// Função auxiliar para criar um gerenciador de cache com opções personalizadas
function createCacheManager(options) {
    return new CacheManager(options);
}
//# sourceMappingURL=cache.js.map