import { EventEmitter } from 'events';
import { EmailEventType } from '../constants';

class EmailEventEmitter extends EventEmitter {
    // Custom trigger helper that dispatches non-blocking async listeners
    emitAsync(event: EmailEventType, ...args: any[]): boolean {
        // Enforce non-blocking using setImmediate
        setImmediate(() => {
            try {
                this.emit(event, ...args);
            } catch (err) {
                console.error(`[Email] Listener crashed for event: ${event}`, err);
            }
        });
        return true;
    }
}

export const emailEmitter = new EmailEventEmitter();
export default emailEmitter;
