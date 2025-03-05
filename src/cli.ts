import { Command } from 'commander';
import { registerAnalyzeCommand } from './commands/analyze';
import { registerBenchmarkCommand } from './commands/benchmark';
import { registerBuildCommand } from './commands/build';
import { registerAIOptimizeCommand } from './commands/ai-optimize';

const program = new Command();

registerAnalyzeCommand(program);
registerBenchmarkCommand(program);
registerBuildCommand(program);
registerAIOptimizeCommand(program);

program.parse(process.argv);