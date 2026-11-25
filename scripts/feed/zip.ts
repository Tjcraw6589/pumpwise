// Reads the first file out of a .zip, enough for the single-file archives some governments publish.
// Uses the central directory, so it also works when the local header leaves the sizes blank. Built on
// standard web APIs (DataView, DecompressionStream), which Node has built in.

export async function firstFileInZip(zip: Uint8Array): Promise<{ name: string; data: Uint8Array }> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const u32 = (at: number) => view.getUint32(at, true);
  const u16 = (at: number) => view.getUint16(at, true);
  // End of central directory: signature 0x06054b50, within the last 64 KB + 22 bytes.
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i--) {
    if (u32(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const central = u32(eocd + 16);
  if (u32(central) !== 0x02014b50) throw new Error('zip central directory not found');
  const method = u16(central + 10);
  const compressedSize = u32(central + 20);
  const nameLength = u16(central + 28);
  const localOffset = u32(central + 42);
  const name = new TextDecoder().decode(zip.subarray(central + 46, central + 46 + nameLength));
  if (u32(localOffset) !== 0x04034b50) throw new Error('zip local header not found');
  const start = localOffset + 30 + u16(localOffset + 26) + u16(localOffset + 28);
  const body = zip.slice(start, start + compressedSize);
  if (method === 0) return { name, data: body };
  if (method !== 8) throw new Error(`unsupported zip compression method ${method}`);
  const stream = new Blob([body]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return { name, data: new Uint8Array(await new Response(stream).arrayBuffer()) };
}

/**
 * Chosen files out of a .zip with several (an Excel workbook is one). `want` sees each name and size
 * and says whether to unpack it, so a large file that is not needed is never inflated.
 */
export async function filesInZip(zip: Uint8Array, want: (name: string, size: number) => boolean): Promise<Map<string, Uint8Array>> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const u32 = (at: number) => view.getUint32(at, true);
  const u16 = (at: number) => view.getUint16(at, true);
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i--) {
    if (u32(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = u16(eocd + 10);
  const files = new Map<string, Uint8Array>();
  let at = u32(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (at + 46 > zip.length || u32(at) !== 0x02014b50) throw new Error('zip central directory not found');
    const method = u16(at + 10);
    const compressedSize = u32(at + 20);
    const size = u32(at + 24);
    const nameLength = u16(at + 28);
    const localOffset = u32(at + 42);
    const name = new TextDecoder().decode(zip.subarray(at + 46, at + 46 + nameLength));
    at += 46 + nameLength + u16(at + 30) + u16(at + 32);
    if (!want(name, size)) continue;
    if (u32(localOffset) !== 0x04034b50) throw new Error('zip local header not found');
    const start = localOffset + 30 + u16(localOffset + 26) + u16(localOffset + 28);
    const body = zip.slice(start, start + compressedSize);
    if (method === 0) {
      files.set(name, body);
    } else if (method === 8) {
      const stream = new Blob([body]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      files.set(name, new Uint8Array(await new Response(stream).arrayBuffer()));
    } else {
      throw new Error(`unsupported zip compression method ${method}`);
    }
  }
  return files;
}
