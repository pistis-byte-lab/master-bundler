"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgress = exports.ProgressIndicator = void 0;
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("./logger");
class ProgressIndicator {
    constructor(options = {}) {
        this.total = options.total || 100;
        this.current = options.current || 0;
        this.message = options.message || 'Processing...';
        this.status = options.status || 'pending';
        this.startTime = Date.now();
    }
    update(options) {
        if (options.total !== undefined)
            this.total = options.total;
        if (options.current !== undefined)
            this.current = options.current;
        if (options.message)
            this.message = options.message;
        if (options.status)
            this.status = options.status;
        this.render();
    }
    getProgressBar(width = 30) {
        const progress = Math.min(this.current / this.total, 1);
        const filled = Math.round(width * progress);
        const empty = width - filled;
        return `[${'='.repeat(filled)}${'-'.repeat(empty)}] ${Math.round(progress * 100)}%`;
    }
    getTimeEstimate() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const progress = this.current / this.total;
        if (progress === 0)
            return 'estimating...';
        const total = elapsed / progress;
        const remaining = total - elapsed;
        return `${remaining.toFixed(1)}s remaining`;
    }
    getStatusColor() {
        switch (this.status) {
            case 'success': return chalk_1.default.green;
            case 'error': return chalk_1.default.red;
            default: return chalk_1.default.blue;
        }
    }
    render() {
        const color = this.getStatusColor();
        const progress = this.getProgressBar();
        const time = this.getTimeEstimate();
        logger_1.logger.info(`${color('•')} ${this.message}\n  ${progress} ${chalk_1.default.gray(time)}`);
    }
    complete(message = 'Complete') {
        this.update({
            current: this.total,
            message,
            status: 'success'
        });
    }
    fail(message = 'Failed') {
        this.update({
            message,
            status: 'error'
        });
    }
}
exports.ProgressIndicator = ProgressIndicator;
const createProgress = (options) => {
    return new ProgressIndicator(options);
};
exports.createProgress = createProgress;
//# sourceMappingURL=progress.js.map