import { emailConfig } from '../config';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    customLabel = 'Operation'
): Promise<T> => {
    const { maxRetries, initialDelayMs, backoffFactor } = emailConfig.retry;
    let attempt = 0;
    let delay = initialDelayMs;

    while (true) {
        try {
            return await operation();
        } catch (error) {
            attempt++;
            if (attempt > maxRetries) {
                console.error(`❌ [Email] ${customLabel} failed after ${maxRetries} retries:`, error);
                throw error;
            }
            console.warn(
                `⚠️ [Email] ${customLabel} failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`
            );
            await sleep(delay);
            delay *= backoffFactor;
        }
    }
};
