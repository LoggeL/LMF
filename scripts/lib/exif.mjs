/**
 * Minimal JPEG/EXIF reader for the GPS check (validate rule 21) and scripts/strip-gps.mjs.
 * Finds the APP1 "Exif" segment, walks IFD0 and returns the GPS IFD pointer (tag 0x8825).
 */
const GPS_TAG = 0x8825;
const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

/** Returns { tiff, little, ifd0, gpsEntryOffset, gpsIfdOffset } or null when there is no EXIF. */
export function locateExif(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null; // not a JPEG
  let pos = 2;
  while (pos + 4 <= buf.length) {
    if (buf[pos] !== 0xff) return null;
    const marker = buf[pos + 1];
    if (marker === 0xda || marker === 0xd9) return null; // start of scan / end: no more metadata
    const len = buf.readUInt16BE(pos + 2);
    if (marker === 0xe1 && buf.toString("latin1", pos + 4, pos + 10) === "Exif\0\0") {
      const tiff = pos + 10;
      const little = buf.toString("latin1", tiff, tiff + 2) === "II";
      const u16 = (o) => (little ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
      const u32 = (o) => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
      const ifd0 = tiff + u32(tiff + 4);
      const n = u16(ifd0);
      for (let i = 0; i < n; i++) {
        const e = ifd0 + 2 + i * 12;
        if (u16(e) === GPS_TAG) return { tiff, little, ifd0, gpsEntryOffset: e, gpsIfdOffset: tiff + u32(e + 8), u16, u32 };
      }
      return { tiff, little, ifd0, gpsEntryOffset: null, gpsIfdOffset: null, u16, u32 };
    }
    pos += 2 + len;
  }
  return null;
}

/** True if the JPEG still carries a non-empty GPS IFD. */
export function hasGps(buf) {
  const x = locateExif(buf);
  if (!x || x.gpsIfdOffset === null) return false;
  return x.u16(x.gpsIfdOffset) > 0;
}

/**
 * Removes GPS data in place (same file length, other EXIF such as orientation stays):
 * zeroes every GPS value (inline and out-of-line) and sets the GPS IFD entry count to 0.
 * Returns true if something was removed.
 */
export function stripGpsInPlace(buf) {
  const x = locateExif(buf);
  if (!x || x.gpsIfdOffset === null) return false;
  const { u16, u32, tiff, little } = x;
  const n = u16(x.gpsIfdOffset);
  if (n === 0) return false;
  for (let i = 0; i < n; i++) {
    const e = x.gpsIfdOffset + 2 + i * 12;
    const size = (TYPE_SIZE[u16(e + 2)] ?? 1) * u32(e + 4);
    if (size > 4) buf.fill(0, tiff + u32(e + 8), tiff + u32(e + 8) + size);
    buf.fill(0, e, e + 12);
  }
  if (little) buf.writeUInt16LE(0, x.gpsIfdOffset);
  else buf.writeUInt16BE(0, x.gpsIfdOffset);
  return true;
}
