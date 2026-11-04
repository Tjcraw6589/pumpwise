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
