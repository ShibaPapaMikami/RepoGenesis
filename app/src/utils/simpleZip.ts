interface ZipEntry {
  path: string;
  content: string;
}

interface ZipRecord {
  nameBytes: Uint8Array;
  dataBytes: Uint8Array;
  crc32: number;
  size: number;
  modTime: number;
  modDate: number;
  localHeaderOffset: number;
}

const encoder = new TextEncoder();

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) !== 0 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createDosTimestamp(date: Date): { modTime: number; modDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const modTime = ((date.getHours() & 0x1f) << 11)
    | ((date.getMinutes() & 0x3f) << 5)
    | Math.floor(date.getSeconds() / 2);
  const modDate = (((year - 1980) & 0x7f) << 9)
    | (((date.getMonth() + 1) & 0x0f) << 5)
    | (date.getDate() & 0x1f);
  return { modTime, modDate };
}

function writeUint16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function createZipBlob(entries: ZipEntry[]): Blob {
  const records: ZipRecord[] = [];
  const localParts: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const { modTime, modDate } = createDosTimestamp(now);

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.content);
    const size = dataBytes.length;
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, modTime);
    writeUint16(localView, 12, modDate);
    writeUint32(localView, 14, crc);
    writeUint32(localView, 18, size);
    writeUint32(localView, 22, size);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);

    localParts.push(localHeader, nameBytes, dataBytes);

    records.push({
      nameBytes,
      dataBytes,
      crc32: crc,
      size,
      modTime,
      modDate,
      localHeaderOffset: offset,
    });

    offset += localHeader.length + nameBytes.length + dataBytes.length;
  }

  const centralParts: Uint8Array[] = [];
  let centralSize = 0;
  for (const record of records) {
    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, record.modTime);
    writeUint16(centralView, 14, record.modDate);
    writeUint32(centralView, 16, record.crc32);
    writeUint32(centralView, 20, record.size);
    writeUint32(centralView, 24, record.size);
    writeUint16(centralView, 28, record.nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, record.localHeaderOffset);

    centralParts.push(centralHeader, record.nameBytes);
    centralSize += centralHeader.length + record.nameBytes.length;
  }

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, records.length);
  writeUint16(endView, 10, records.length);
  writeUint32(endView, 12, centralSize);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  const zipBytes = concatBytes([...localParts, ...centralParts, endRecord]);
  const blobBytes = new Uint8Array(zipBytes.length);
  blobBytes.set(zipBytes);
  return new Blob([blobBytes], { type: 'application/zip' });
}
