"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetPlugin = void 0;
const logger_1 = require("../../utils/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
class AssetPlugin {
    constructor() {
        this.name = 'assets';
        this.manifest = {};
        this.defaultConfig = {
            patterns: ['**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot}'],
            flatten: false,
            optimize: {
                images: true,
                quality: 80,
                maxWidth: 1920,
                maxHeight: 1080
            },
            fingerprint: {
                enabled: true,
                algorithm: 'md5',
                length: 8,
                manifestPath: 'asset-manifest.json'
            }
        };
    }
    ensureDir(dir) {
        if (!fs_1.default.existsSync(dir)) {
            logger_1.logger.info(`Creating directory: ${dir}`);
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    getOutputPath(sourcePath, config, options) {
        logger_1.logger.info(`Computing output path for source: ${sourcePath}`);
        const outputDir = config.outputDir ||
            (options.outDir ? path_1.default.join(options.outDir, 'assets') : 'dist/assets');
        if (config.flatten) {
            const outputPath = path_1.default.join(outputDir, path_1.default.basename(sourcePath));
            logger_1.logger.info(`Flattened output path: ${outputPath}`);
            return outputPath;
        }
        const assetDir = path_1.default.dirname(path_1.default.resolve(sourcePath));
        const assetName = path_1.default.basename(sourcePath);
        const sourceDirStructure = path_1.default.dirname(sourcePath).split(path_1.default.sep);
        const lastDir = sourceDirStructure[sourceDirStructure.length - 1];
        if (this.isFontFile(sourcePath)) {
            const fontOutputPath = path_1.default.join(outputDir, lastDir, assetName);
            logger_1.logger.info(`Font output path: ${fontOutputPath}`);
            return fontOutputPath;
        }
        const outputPath = path_1.default.join(outputDir, assetName);
        logger_1.logger.info(`Asset output path: ${outputPath}`);
        return outputPath;
    }
    async generateFingerprint(filePath, config) {
        var _a;
        if (!((_a = config.fingerprint) === null || _a === void 0 ? void 0 : _a.enabled)) {
            return '';
        }
        const content = fs_1.default.readFileSync(filePath);
        const hash = crypto_1.default
            .createHash(config.fingerprint.algorithm || 'md5')
            .update(content)
            .digest('hex')
            .slice(0, config.fingerprint.length || 8);
        logger_1.logger.info(`Generated fingerprint for ${filePath}: ${hash}`);
        return hash;
    }
    getFingerprintedPath(originalPath, hash) {
        const ext = path_1.default.extname(originalPath);
        const basePath = originalPath.slice(0, -ext.length);
        return `${basePath}.${hash}${ext}`;
    }
    isFontFile(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        return ['.woff', '.woff2', '.ttf', '.eot'].includes(ext);
    }
    async optimizeImage(source, dest, config) {
        var _a, _b, _c, _d, _e;
        const ext = path_1.default.extname(source).toLowerCase();
        const isImage = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext);
        if (!isImage || !((_a = config.optimize) === null || _a === void 0 ? void 0 : _a.images)) {
            fs_1.default.copyFileSync(source, dest);
            logger_1.logger.info(`Copied asset: ${source} → ${dest}`);
            return;
        }
        try {
            const image = (0, sharp_1.default)(source);
            const metadata = await image.metadata();
            if (!metadata) {
                throw new Error('Could not read image metadata');
            }
            if (metadata.width && metadata.height) {
                const maxWidth = ((_b = config.optimize) === null || _b === void 0 ? void 0 : _b.maxWidth) || 1920;
                const maxHeight = ((_c = config.optimize) === null || _c === void 0 ? void 0 : _c.maxHeight) || 1080;
                if (metadata.width > maxWidth || metadata.height > maxHeight) {
                    image.resize(maxWidth, maxHeight, {
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                    logger_1.logger.info(`Resizing image from ${metadata.width}x${metadata.height} to max ${maxWidth}x${maxHeight}`);
                }
            }
            if (ext === '.png') {
                await image
                    .png({ quality: ((_d = config.optimize) === null || _d === void 0 ? void 0 : _d.quality) || 80 })
                    .toFile(dest);
            }
            else {
                await image
                    .jpeg({ quality: ((_e = config.optimize) === null || _e === void 0 ? void 0 : _e.quality) || 80 })
                    .toFile(dest);
            }
            const optimizedMetadata = await (0, sharp_1.default)(dest).metadata();
            if (optimizedMetadata) {
                logger_1.logger.info(`Optimized image: ${source} → ${dest} (${optimizedMetadata.width}x${optimizedMetadata.height})`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Failed to optimize image ${source}: ${errorMessage}`);
            fs_1.default.copyFileSync(source, dest);
            logger_1.logger.info(`Fallback: copied asset ${source} → ${dest}`);
        }
    }
    setup(options) {
        logger_1.logger.info('Asset plugin setup');
        this.manifest = {};
    }
    async beforeTransform(context) {
        var _a;
        const { config, filePath, options } = context;
        if (!(config === null || config === void 0 ? void 0 : config.patterns)) {
            return context.content;
        }
        try {
            const isAsset = config.patterns.some(pattern => {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(filePath);
            });
            if (!isAsset) {
                return context.content;
            }
            logger_1.logger.info(`Processing asset file: ${filePath}`);
            logger_1.logger.info(`Config: ${JSON.stringify(config, null, 2)}`);
            const hash = ((_a = config.fingerprint) === null || _a === void 0 ? void 0 : _a.enabled) ?
                await this.generateFingerprint(filePath, config) : '';
            let outputPath = this.getOutputPath(filePath, config, options);
            if (hash) {
                const fingerprintedPath = this.getFingerprintedPath(outputPath, hash);
                this.manifest[outputPath] = fingerprintedPath;
                outputPath = fingerprintedPath;
            }
            this.ensureDir(path_1.default.dirname(outputPath));
            if (this.isFontFile(filePath)) {
                logger_1.logger.info(`Processing font file: ${filePath}`);
                fs_1.default.copyFileSync(filePath, outputPath);
                logger_1.logger.info(`Copied font: ${filePath} → ${outputPath}`);
            }
            else {
                await this.optimizeImage(filePath, outputPath, config);
            }
            return context.content;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Error processing asset ${filePath}: ${errorMessage}`);
            throw error;
        }
    }
    cleanup() {
        var _a;
        logger_1.logger.info('Asset plugin cleanup');
        const config = this.defaultConfig;
        if (((_a = config.fingerprint) === null || _a === void 0 ? void 0 : _a.enabled) && Object.keys(this.manifest).length > 0) {
            const manifestPath = path_1.default.join(process.cwd(), config.fingerprint.manifestPath || 'asset-manifest.json');
            fs_1.default.writeFileSync(manifestPath, JSON.stringify(this.manifest, null, 2));
            logger_1.logger.info(`Asset manifest written to: ${manifestPath}`);
        }
    }
}
exports.AssetPlugin = AssetPlugin;
//# sourceMappingURL=assets.js.map