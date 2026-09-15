import * as http from 'http';
import { PageProbe } from './pageProbe';

const DEFAULT_TIMEOUT_MS = 1000;

export function createHttpPageProbe(timeoutMs = DEFAULT_TIMEOUT_MS): PageProbe {
  return {
    exists(url: string): Promise<boolean> {
      return new Promise((resolve) => {
        const req = http.get(url, (res) => {
          res.resume();
          const status = res.statusCode ?? 0;
          resolve(status >= 200 && status < 300);
        });
        req.setTimeout(timeoutMs, () => {
          req.destroy();
          resolve(false);
        });
        req.on('error', () => {
          resolve(false);
        });
      });
    },
  };
}
