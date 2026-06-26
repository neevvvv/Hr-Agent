const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Stream a planning session via SSE.
 * Calls onEvent(name, payload) for each event from the server.
 * Returns a Promise that resolves when the stream is done.
 */
export function streamPlan({ token, message, onEvent }) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(`${API}/plan/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // SSE messages are separated by blank lines
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const block of parts) {
          const lines = block.split('\n');
          let event = 'message';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            else if (line.startsWith('data: ')) data += line.slice(6);
          }
          if (data) {
            try {
              onEvent(event, JSON.parse(data));
            } catch (e) {
              console.error('SSE parse:', e, data);
            }
          }
          if (event === 'done' || event === 'error') {
            return resolve();
          }
        }
      }
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}