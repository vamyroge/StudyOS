export function chunkText(content: string, maxChars = 900): string[] {
  const paragraphs = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) chunks.push(current);
      for (let index = 0; index < paragraph.length; index += maxChars) {
        chunks.push(paragraph.slice(index, index + maxChars));
      }
      current = "";
    } else if ((current + "\n\n" + paragraph).length > maxChars) {
      if (current) chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

export async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const safeConcurrency = Math.max(1, Math.min(concurrency, values.length || 1));
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  }

  await Promise.all(Array.from({ length: safeConcurrency }, worker));
  return results;
}
