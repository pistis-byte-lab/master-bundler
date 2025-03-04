"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSPlugin = void 0;
const logger_1 = require("../../utils/logger");
const sass = __importStar(require("sass"));
const postcss_1 = __importDefault(require("postcss"));
const cssnano_1 = __importDefault(require("cssnano"));
const autoprefixer_1 = __importDefault(require("autoprefixer"));
class CSSPlugin {
    constructor() {
        this.name = 'css';
        this.postcssProcessor = (0, postcss_1.default)([
            autoprefixer_1.default,
            (0, cssnano_1.default)({
                preset: ['default', {
                        discardComments: { removeAll: true },
                        normalizeWhitespace: true
                    }]
            })
        ]);
    }
    setup(options) {
        logger_1.logger.info('CSS plugin setup');
    }
    async transform(context) {
        const { filePath, content } = context;
        // Only process .css and .scss files
        if (!filePath.endsWith('.css') && !filePath.endsWith('.scss')) {
            return content;
        }
        // Handle empty files
        if (!content.trim()) {
            return '';
        }
        try {
            logger_1.logger.info(`Processing ${filePath}`);
            // Compile SCSS to CSS if needed
            let css = content;
            if (filePath.endsWith('.scss')) {
                logger_1.logger.info('Compiling SCSS to CSS');
                const result = sass.compileString(content, {
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                    style: 'expanded'
                });
                css = result.css.toString();
                logger_1.logger.info('SCSS compilation complete');
            }
            // Process with PostCSS (autoprefixer + minification)
            logger_1.logger.info('Running PostCSS transformations');
            const result = await this.postcssProcessor.process(css, {
                from: filePath,
                to: filePath.replace('.scss', '.css'),
                map: { inline: true }
            });
            logger_1.logger.success(`Processed ${filePath}`);
            return result.css;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Error processing ${filePath}: ${errorMessage}`);
            throw error;
        }
    }
    cleanup() {
        logger_1.logger.info('CSS plugin cleanup');
    }
}
exports.CSSPlugin = CSSPlugin;
//# sourceMappingURL=css.js.map