export interface StreamEvent {
  type: "chunk" | "done" | "error";
  content?: string;
  messageId?: string;
  message?: string;
  titleUpdate?: string | null;
}

/**
 * Helper to process Server-Sent Events from a fetch Response stream
 *
 * @param response Fetch Response object
 * @param onEvent Callback function for parsed JSON stream events
 */
export async function parseStream(
  response: Response,
  onEvent: (event: StreamEvent) => void,
) {
  if (!response.body)
    throw new Error("ReadableStream not supported in this browser.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Process complete lines
      // The last element is the leftover partial line (might be empty)
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          try {
            const eventData = JSON.parse(dataStr) as StreamEvent;
            onEvent(eventData);
          } catch (e) {
            console.error("Failed to parse SSE JSON:", e, dataStr);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
