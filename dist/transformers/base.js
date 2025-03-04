"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTransformer = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
/**
 * Base class for custom transformers
 */
class BaseTransformer extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.name = options.name;
        this.extensions = options.extensions || [];
        logger_1.logger.debug(`Registered transformer: ${this.name} for extensions: ${this.extensions.join(', ')}`);
    }
    /**
     * Checks if this transformer can process the given file
     */
    canTransform(filePath) {
        return this.extensions.some(ext => filePath.endsWith(ext));
    }
    /**
     * Pre-transform hook
     */
    async preTransform(context) {
        return context;
    }
    /**
     * Post-transform hook
     */
    async postTransform(context) {
        return context;
    }
    /**
     * Process a file through the complete transformation pipeline
     */
    async process(context) {
        try {
            // Pre-transform
            const preContext = await this.preTransform(context);
            // Main transform
            const transformedContext = await this.transform(preContext);
            // Post-transform
            const finalContext = await this.postTransform(transformedContext);
            return finalContext;
        }
        catch (error) {
            logger_1.logger.error(`Transformer ${this.name} error:`, error);
            this.emit('error', error);
            throw error;
        }
    }
}
exports.BaseTransformer = BaseTransformer;
//# sourceMappingURL=base.js.map