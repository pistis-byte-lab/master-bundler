"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinifyPlugin = void 0;
const logger_1 = require("../../utils/logger");
class MinifyPlugin {
    constructor() {
        this.name = 'minify';
    }
    setup(options) {
        logger_1.logger.info('Minify plugin setup');
    }
    async transform(context) {
        logger_1.logger.info('Minifying code...');
        // Simple minification example
        return context.content
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\/\*.*?\*\//g, '') // Remove multiline comments
            .replace(/\/\/.*/g, '') // Remove single line comments
            .trim();
    }
    cleanup() {
        logger_1.logger.info('Minify plugin cleanup');
    }
}
exports.MinifyPlugin = MinifyPlugin;
//# sourceMappingURL=minify.js.map