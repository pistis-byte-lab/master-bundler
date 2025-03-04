import chalk from 'chalk';
import { logger } from './logger';

export interface ProgressOptions {
  total?: number;
  current?: number;
  message?: string;
  status?: 'pending' | 'success' | 'error';
}

export class ProgressIndicator {
  private total: number;
  private current: number;
  private startTime: number;
  private message: string;
  private status: 'pending' | 'success' | 'error';

  constructor(options: ProgressOptions = {}) {
    this.total = options.total || 100;
    this.current = options.current || 0;
    this.message = options.message || 'Processing...';
    this.status = options.status || 'pending';
    this.startTime = Date.now();
  }

  public update(options: ProgressOptions): void {
    if (options.total !== undefined) this.total = options.total;
    if (options.current !== undefined) this.current = options.current;
    if (options.message) this.message = options.message;
    if (options.status) this.status = options.status;
    this.render();
  }

  private getProgressBar(width: number = 30): string {
    const progress = Math.min(this.current / this.total, 1);
    const filled = Math.round(width * progress);
    const empty = width - filled;
    
    return `[${'='.repeat(filled)}${'-'.repeat(empty)}] ${Math.round(progress * 100)}%`;
  }

  private getTimeEstimate(): string {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const progress = this.current / this.total;
    if (progress === 0) return 'estimating...';
    
    const total = elapsed / progress;
    const remaining = total - elapsed;
    return `${remaining.toFixed(1)}s remaining`;
  }

  private getStatusColor(): chalk.Chalk {
    switch (this.status) {
      case 'success': return chalk.green;
      case 'error': return chalk.red;
      default: return chalk.blue;
    }
  }

  private render(): void {
    const color = this.getStatusColor();
    const progress = this.getProgressBar();
    const time = this.getTimeEstimate();
    
    logger.info(`${color('•')} ${this.message}\n  ${progress} ${chalk.gray(time)}`);
  }

  public complete(message: string = 'Complete'): void {
    this.update({
      current: this.total,
      message,
      status: 'success'
    });
  }

  public fail(message: string = 'Failed'): void {
    this.update({
      message,
      status: 'error'
    });
  }
}

export const createProgress = (options?: ProgressOptions): ProgressIndicator => {
  return new ProgressIndicator(options);
};
