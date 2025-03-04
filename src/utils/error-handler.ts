
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export interface SyntaxError {
  message: string;
  line?: number;
  column?: number;
  file?: string;
  code?: string;
  frame?: string;
}

export function formatSyntaxError(error: SyntaxError): string {
  let output = '';
  
  // Header with file information
  if (error.file) {
    output += `${chalk.bold.red('Error in')} ${chalk.bold.cyan(path.relative(process.cwd(), error.file))}`;
    
    if (error.line !== undefined) {
      output += `:${chalk.bold.yellow(error.line.toString())}`;
      
      if (error.column !== undefined) {
        output += `:${chalk.bold.yellow(error.column.toString())}`;
      }
    }
    
    output += '\n\n';
  }
  
  // Error message
  output += `${chalk.red('✖')} ${chalk.bold.red(error.message)}\n\n`;
  
  // If we have a frame from the compiler, use it
  if (error.frame) {
    output += `${error.frame}\n\n`;
  } 
  // Otherwise, try to generate our own error context
  else if (error.file && error.line !== undefined) {
    try {
      output += generateErrorContext(error.file, error.line, error.column);
      output += '\n\n';
    } catch (err) {
      logger.debug('Failed to generate error context:', err);
    }
  }
  
  // Add recovery suggestions
  output += suggestRecovery(error);
  
  return output;
}

function generateErrorContext(filePath: string, lineNumber: number, column?: number): string {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
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
      output += chalk.bgRed.white(`${lineNum} | `) + chalk.red(lines[i]) + '\n';
      
      // Add pointer to specific column if provided
      if (column !== undefined) {
        const padding = ' '.repeat(lineNum.length + 3 + (column - 1));
        output += padding + chalk.red.bold('^') + '\n';
      }
    } else {
      output += chalk.gray(`${lineNum} | ${lines[i]}`) + '\n';
    }
  }
  
  return output;
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
