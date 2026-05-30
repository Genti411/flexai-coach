// Generates placeholder brand icons (teal background, white "F" mark) as valid PNGs
// with no native image dependency. Run: node scripts/gen-icons.js
// Replace these with designed artwork before store submission.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TEAL = [0x2f, 0x8f, 0x83, 0xff];
const WHITE = [0xff, 0xff, 0xff, 0xff];
const CLEAR = [0, 0, 0, 0];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = compression/filter/interlace = 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function canvas(size, bg) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = bg[0];
    buf[i * 4 + 1] = bg[1];
    buf[i * 4 + 2] = bg[2];
    buf[i * 4 + 3] = bg[3];
  }
  return buf;
}

function rect(buf, size, color, x0, y0, x1, y1) {
  for (let y = Math.max(0, y0); y < Math.min(size, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(size, x1); x++) {
      const i = (y * size + x) * 4;
      buf[i] = color[0];
      buf[i + 1] = color[1];
      buf[i + 2] = color[2];
      buf[i + 3] = color[3];
    }
  }
}

// Draw an "F" glyph scaled to the canvas. scale shrinks the glyph (for safe zones).
function drawF(buf, size, color, scale) {
  const inset = (size * (1 - scale)) / 2;
  const u = (size - inset * 2) / 10; // unit
  const x = inset;
  const y = inset;
  rect(buf, size, color, x + 2 * u, y + u, x + 3.4 * u, y + 9 * u); // vertical stem
  rect(buf, size, color, x + 2 * u, y + u, x + 7.5 * u, y + 2.4 * u); // top bar
  rect(buf, size, color, x + 2 * u, y + 4.3 * u, x + 6.5 * u, y + 5.6 * u); // middle bar
}

const outDir = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(outDir, { recursive: true });

function write(name, size, bg, glyphScale) {
  const buf = canvas(size, bg);
  drawF(buf, size, bg === CLEAR ? WHITE : WHITE, glyphScale);
  fs.writeFileSync(path.join(outDir, name), encodePng(size, size, buf));
  console.log('wrote', name, size + 'x' + size);
}

write('icon.png', 1024, TEAL, 1.0);
write('splash-icon.png', 1024, CLEAR, 0.7); // splash plugin paints the bg color
write('android-icon-foreground.png', 1024, CLEAR, 0.66); // adaptive safe zone
write('favicon.png', 48, TEAL, 1.0);
console.log('done');
