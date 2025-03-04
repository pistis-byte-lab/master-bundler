"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSyntaxError = formatSyntaxError;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
function formatSyntaxError(error) {
    let output = '';
    // Header with file information
    if (error.file) {
        output += `${chalk_1.default.bold.red('Error in')} ${chalk_1.default.bold.cyan(path_1.default.relative(process.cwd(), error.file))}`;
        if (error.line !== undefined) {
            output += `:${chalk_1.default.bold.yellow(error.line.toString())}`;
            if (error.column !== undefined) {
                output += `:${chalk_1.default.bold.yellow(error.column.toString())}`;
            }
        }
        output += '\n\n';
    }
    // Error message
    output += `${chalk_1.default.red('✖')} ${chalk_1.default.bold.red(error.message)}\n\n`;
    // If we have a frame from the compiler, use it
    if (error.frame) {
        output += `${error.frame}\n\n`;
    }
    // Otherwise, try to generate our own error context
    else if (error.file && error.line !== undefined) {
        try {
            output += generateErrorContext(error.file, error.line, error.column);
            output += '\n\n';
        }
        catch (err) {
            logger_1.logger.debug('Failed to generate error context:', err);
        }
    }
    // Add recovery suggestions
    output += suggestRecovery(error);
    return output;
}
function generateErrorContext(filePath, lineNumber, column) {
    if (!fs_1.default.existsSync(filePath)) {
        return '';
    }
    const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    // Line numbers to show (context around the error)
    const contextSize = 2;
    const startLine = Math.max(0, lineNumber - contextSize - 1);
    const endLine = Math.min(lines.length - 1, lineNumber + contextSize - 1);
    let output = '';
    // Add line numbers and content
    for (let i = startLine; i <= endLine; i++) {
        const isErrorLine = i === lineNumber - 1;
        const lineNum = String(i + 1).padStart(4);
        if (isErrorLine) {
            output += chalk_1.default.bgRed.white(`${lineNum} | `) + chalk_1.default.red(lines[i]) + '\n';
            // Add pointer to specific column if provided
            if (column !== undefined) {
                const padding = ' '.repeat(lineNum.length + 3 + (column - 1));
                output += padding + chalk_1.default.red.bold('^') + '\n';
            }
        }
        else {
            output += chalk_1.default.gray(`${lineNum} | ${lines[i]}`) + '\n';
        }
    }
    return output;
}
function suggestRecovery(error) {
    const message = error.message.toLowerCase();
    if (message.includes('unexpected token')) {
        return chalk_1.default.green('💡 Suggestion: Check for unmatched brackets, parentheses, or missing semicolons.');
    }
    else if (message.includes('cannot find module')) {
        return chalk_1.default.green('💡 Suggestion: The module may not be installed. Try running `npm install <module-name>`.');
    }
    else if (message.includes('undefined') && message.includes('not assignable')) {
        return chalk_1.default.green('💡 Suggestion: The variable may be undefined. Use optional chaining (?.) or add a type guard.');
    }
    else if (message.includes('type') && message.includes('not assignable')) {
        return chalk_1.default.green('💡 Suggestion: The types are incompatible. Check your type definitions or use type casting if necessary.');
    }
    else if (message.includes('is not a function')) {
        return chalk_1.default.green('💡 Suggestion: Verify that the variable is a function and is spelled correctly.');
    }
    else if (message.includes('is not defined')) {
        return chalk_1.default.green('💡 Suggestion: Define the variable before using it or check for typos.');
    }
    else if (message.includes('duplicate identifier')) {
        return chalk_1.default.green('💡 Suggestion: A variable with this name already exists in this scope. Use a different name.');
    }
    return chalk_1.default.green('💡 Suggestion: Review the error carefully and check the documentation for more information.');
}
//# sourceMappingURL=error-handler.js.map