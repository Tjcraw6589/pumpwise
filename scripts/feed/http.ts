// Polite HTTP for the feed job: one request at a time per source, a gap between requests, and a
// few retries with back-off for rate limits, server errors and dropped connections.

export const USER_AGENT = 'Pumpwise-feed/2.0 (+https://tjcraw6589.github.io/pumpwise/)';

export function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Requester {
  (url: string, init?: RequestInit): Promise<Response>;
}

export function politeRequester(minGapMs: number, accept = 'application/json'): Requester {
  let last = 0;
  const run = async (url: string, init: RequestInit = {}, attempt = 1): Promise<Response> => {
    const wait = last + minGapMs - Date.now();
    if (wait > 0) await pause(wait);
    last = Date.now();
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'User-Agent': USER_AGENT, Accept: accept, ...init.headers },
        signal: AbortSignal.timeout(60_000),
      });
      if ((response.status === 429 || response.status >= 500) && attempt < 4) {
        console.warn(`${response.status} from ${url}, retrying (attempt ${attempt + 1})`);
        await pause(5000 * 2 ** (attempt - 1));
        return run(url, init, attempt + 1);
      }
      return response;
    } catch (error) {
      if (attempt < 4) {
        console.warn(`Network error for ${url}: ${String(error)}, retrying`);
        await pause(5000 * 2 ** (attempt - 1));
        return run(url, init, attempt + 1);
      }
      throw error;
    }
  };
  return (url, init) => run(url, init);
}
