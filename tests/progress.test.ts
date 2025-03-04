import { ProgressIndicator, createProgress } from '../src/utils/progress';
import { logger } from '../src/utils/logger';

// Mock logger to capture output
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn()
  }
}));

describe('Progress Indicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a progress indicator with default values', () => {
    const progress = createProgress();
    progress.update({});
    
    expect(logger.info).toHaveBeenCalled();
    const output = (logger.info as jest.Mock).mock.calls[0][0];
    expect(output).toContain('Processing...');
    expect(output).toContain('0%');
  });

  it('should update progress correctly', () => {
    const progress = createProgress({
      total: 100,
      message: 'Building...'
    });

    progress.update({ current: 50 });
    
    let output = (logger.info as jest.Mock).mock.calls[0][0];
    expect(output).toContain('Building...');
    expect(output).toContain('50%');

    progress.update({ current: 75 });
    output = (logger.info as jest.Mock).mock.calls[1][0];
    expect(output).toContain('75%');
  });

  it('should show success state on completion', () => {
    const progress = createProgress();
    progress.complete('Build successful');
    
    const output = (logger.info as jest.Mock).mock.calls[0][0];
    expect(output).toContain('Build successful');
    expect(output).toContain('100%');
  });

  it('should show error state on failure', () => {
    const progress = createProgress();
    progress.fail('Build failed');
    
    const output = (logger.info as jest.Mock).mock.calls[0][0];
    expect(output).toContain('Build failed');
  });

  it('should estimate remaining time', () => {
    jest.useFakeTimers();
    
    const progress = createProgress();
    progress.update({ current: 50 });
    
    jest.advanceTimersByTime(5000); // Advance 5 seconds
    
    progress.update({ current: 75 });
    const output = (logger.info as jest.Mock).mock.calls[1][0];
    expect(output).toContain('remaining');
    
    jest.useRealTimers();
  });
});
