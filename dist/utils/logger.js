"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
exports.logger = {
    info: (message) => console.log(chalk_1.default.blue('info'), message),
    success: (message) => console.log(chalk_1.default.green('success'), message),
    warning: (message) => console.log(chalk_1.default.yellow('warning'), message),
    error: (message) => console.error(chalk_1.default.red('error'), message),
};
//# sourceMappingURL=logger.js.map