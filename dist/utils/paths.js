"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveInput = resolveInput;
exports.getOutputPath = getOutputPath;
exports.ensureDir = ensureDir;
exports.normalizeInputPath = normalizeInputPath;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function resolveInput(input) {
    const absolutePath = path_1.default.isAbsolute(input) ? input : path_1.default.resolve(process.cwd(), input);
    if (!fs_1.default.existsSync(absolutePath)) {
        throw new Error(`Input file not found: ${absolutePath}`);
    }
    return absolutePath;
}
function getOutputPath(input, format, outDir) {
    const inputName = path_1.default.basename(input, path_1.default.extname(input));
    const ext = format === 'esm' ? '.mjs' : '.js';
    // Use provided outDir or default to input file's directory + 'dist'
    const resolvedOutDir = outDir
        ? path_1.default.resolve(outDir)
        : path_1.default.resolve(path_1.default.dirname(input), 'dist');
    // Ensure output directory exists
    fs_1.default.mkdirSync(resolvedOutDir, { recursive: true });
    return path_1.default.join(resolvedOutDir, `${inputName}.${format}${ext}`);
}
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
function normalizeInputPath(input) {
    return path_1.default.normalize(input).replace(/\\/g, '/');
}
//# sourceMappingURL=paths.js.map