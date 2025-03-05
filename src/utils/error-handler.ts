import chalk from 'chalk';
import { logger } from './logger';

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function handleError(error: unknown, context?: string): void {
  const errorMessage = formatError(error);

  if (context) {
    logger.error(`${context}: ${errorMessage}`);
  } else {
    logger.error(errorMessage);
  }

  // Para erros de sintaxe, tente fornecer orientações úteis
  if (error instanceof SyntaxError) {
    const suggestion = suggestRecovery(error);
    logger.info(suggestion);
  }
}

export function generateErrorContext(filePath: string, line: number, column: number, content: string): string {
  try {
    const lines = content.split('\n');
    const errorLine = lines[line - 1];

    if (!errorLine) {
      return chalk.red('Could not locate the error line in the source file.');
    }

    const start = Math.max(0, line - 3);
    const end = Math.min(lines.length, line + 2);

    let contextStr = chalk.gray('...\n');

    for (let i = start; i < end; i++) {
      const lineNumber = String(i + 1).padStart(4, ' ');
      const currentLine = lines[i] || '';

      if (i === line - 1) {
        contextStr += chalk.cyan(`${lineNumber} | `) + currentLine + '\n';
        contextStr += chalk.cyan('      | ') + ' '.repeat(column - 1) + chalk.red('^') + '\n';
      } else {
        contextStr += chalk.gray(`${lineNumber} | `) + currentLine + '\n';
      }
    }

    contextStr += chalk.gray('...');
    return contextStr;
  } catch (err) {
    logger.debug('Failed to generate error context: ' + formatError(err));
    return '';
  }
}

function suggestRecovery(error: SyntaxError): string {
  const message = error.message.toLowerCase();

  if (message.includes('unexpected token')) {
    return chalk.green('💡 Suggestion: Check for unmatched brackets, parentheses, or missing semicolons.');
  } else if (message.includes('cannot find module')) {
    return chalk.green('💡 Suggestion: The module may not be installed. Try running `npm install <module-name>`.');
  } else if (message.includes('undefined') && message.includes('not assignable')) {
    return chalk.green('💡 Suggestion: The variable may be undefined. Use optional chaining (?.) or add a type guard.');
  } else if (message.includes('type') && message.includes('not assignable')) {
    return chalk.green('💡 Suggestion: The types are incompatible. Check your type definitions or use type casting if necessary.');
  } else if (message.includes('is not a function')) {
    return chalk.green('💡 Suggestion: Verify that the variable is a function and is spelled correctly.');
  } else if (message.includes('is not defined')) {
    return chalk.green('💡 Suggestion: Define the variable before using it or check for typos.');
  } else if (message.includes('duplicate identifier')) {
    return chalk.green('💡 Suggestion: A variable with this name already exists in this scope. Use a different name.');
  }

  return chalk.green('💡 Suggestion: Review the error carefully and check the documentation for more information.');
}

export interface SyntaxError {
  message: string;
  line?: number;
  column?: number;
  file?: string;
  code?: string;
  frame?: string;
}