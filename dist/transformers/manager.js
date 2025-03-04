"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformerManager = exports.TransformerManager = void 0;
const typescript_1 = require("./typescript");
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
class TransformerManager {
    constructor() {
        this.transformers = [];
        // Register built-in transformers
        this.registerTransformer(new typescript_1.TypeScriptTransformer());
    }
    /**
     * Register a transformer
     */
    registerTransformer(transformer) {
        // Check if a transformer with this name already exists
        const existing = this.transformers.findIndex(t => t.name === transformer.name);
        if (existing >= 0) {
            // Replace the existing transformer
            this.transformers[existing] = transformer;
            logger_1.logger.debug(`Replaced transformer: ${transformer.name}`);
        }
        else {
            // Add new transformer
            this.transformers.push(transformer);
            logger_1.logger.debug(`Registered transformer: ${transformer.name}`);
        }
    }
    /**
     * Unregister a transformer by name
     */
    unregisterTransformer(name) {
        const initialLength = this.transformers.length;
        this.transformers = this.transformers.filter(t => t.name !== name);
        const removed = initialLength !== this.transformers.length;
        if (removed) {
            logger_1.logger.debug(`Unregistered transformer: ${name}`);
        }
        return removed;
    }
    /**
     * Get a transformer by name
     */
    getTransformer(name) {
        return this.transformers.find(t => t.name === name);
    }
    /**
     * Find transformers that can process the given file
     */
    findTransformersForFile(filePath) {
        return this.transformers.filter(transformer => transformer.canTransform(filePath));
    }
    /**
     * Process a file through appropriate transformers
     */
    async processFile(filePath, content, options = {}) {
        // Find transformers that can handle this file
        const transformers = this.findTransformersForFile(filePath);
        if (transformers.length === 0) {
            logger_1.logger.debug(`No transformers found for ${path_1.default.basename(filePath)}`);
            return { filePath, content, options };
        }
        logger_1.logger.debug(`Found ${transformers.length} transformers for ${path_1.default.basename(filePath)}`);
        // Create initial context
        let context = {
            filePath,
            content,
            options
        };
        // Run file through each transformer in sequence
        for (const transformer of transformers) {
            context = await transformer.process(context);
        }
        return context;
    }
    /**
     * Get all registered transformers
     */
    getAllTransformers() {
        return [...this.transformers];
    }
}
exports.TransformerManager = TransformerManager;
// Create singleton instance
exports.transformerManager = new TransformerManager();
//# sourceMappingURL=manager.js.map