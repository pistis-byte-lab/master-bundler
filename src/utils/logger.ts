import chalk from 'chalk';

export const logger = {
  info: (message: string) => console.log(chalk.blue('info'), message),
  success: (message: string) => console.log(chalk.green('success'), message),
  warning: (message: string) => console.log(chalk.yellow('warning'), message),
  error: (message: string, ...args: any[]) => console.error(chalk.red('error'), message, ...args),
  debug: (message: string) => console.log(chalk.gray('debug'), message),
  warn: (message: string) => console.log(chalk.yellow('warn'), message),
};
