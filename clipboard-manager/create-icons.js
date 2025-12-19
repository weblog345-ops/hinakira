// シンプルなPNGアイコンを生成
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size, color) {
  // PNG署名
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDRチャンク
  const ihdr = createChunk('IHDR', Buffer.concat([
    uint32BE(size),      // width
    uint32BE(size),      // height
    Buffer.from([8]),    // bit depth
    Buffer.from([2]),    // color type (RGB)
    Buffer.from([0]),    // compression
    Buffer.from([0]),    // filter
    Buffer.from([0])     // interlace
  ]));

  // 画像データを作成
  const rowSize = 1 + size * 3; // filter byte + RGB
  const rawData = Buffer.alloc(size * rowSize);

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter: none

    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;

      // クリップボードアイコンのデザイン
      const isClipboard = isInClipboard(x, y, size);
      const isPaper = isInPaper(x, y, size);
      const isClip = isInClip(x, y, size);
      const isLine = isInLine(x, y, size);

      if (isClip) {
        // 濃い青（クリップ部分）
        rawData[pixelOffset] = 58;
        rawData[pixelOffset + 1] = 123;
        rawData[pixelOffset + 2] = 200;
      } else if (isLine) {
        // グレー（テキスト行）
        rawData[pixelOffset] = 200;
        rawData[pixelOffset + 1] = 200;
        rawData[pixelOffset + 2] = 200;
      } else if (isPaper) {
        // 白（紙）
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
      } else if (isClipboard) {
        // 青（クリップボード）
        rawData[pixelOffset] = color.r;
        rawData[pixelOffset + 1] = color.g;
        rawData[pixelOffset + 2] = color.b;
      } else {
        // 透明（背景）- 白にする
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  // IENDチャンク
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function isInClipboard(x, y, s) {
  const nx = x / s, ny = y / s;
  return nx >= 0.19 && nx <= 0.81 && ny >= 0.125 && ny <= 0.91;
}

function isInPaper(x, y, s) {
  const nx = x / s, ny = y / s;
  return nx >= 0.25 && nx <= 0.75 && ny >= 0.19 && ny <= 0.84;
}

function isInClip(x, y, s) {
  const nx = x / s, ny = y / s;
  return nx >= 0.34 && nx <= 0.66 && ny >= 0.06 && ny <= 0.19;
}

function isInLine(x, y, s) {
  const nx = x / s, ny = y / s;
  return nx >= 0.31 && nx <= 0.69 && (
    (ny >= 0.34 && ny <= 0.39) ||
    (ny >= 0.45 && ny <= 0.50) ||
    (ny >= 0.56 && ny <= 0.61) ||
    (ny >= 0.67 && ny <= 0.72)
  );
}

function createChunk(type, data) {
  const length = uint32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const content = Buffer.concat([typeBuffer, data]);
  const crc = crc32(content);
  return Buffer.concat([length, content, crc]);
}

function uint32BE(value) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value, 0);
  return buf;
}

// CRC32テーブル
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  crc = crc ^ 0xFFFFFFFF;
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(crc >>> 0, 0);
  return buf;
}

// アイコン生成
const iconsDir = path.join(__dirname, 'icons');
const color = { r: 74, g: 144, b: 217 }; // #4a90d9

[16, 48, 128].forEach(size => {
  const png = createPNG(size, color);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created: icon${size}.png (${png.length} bytes)`);
});

console.log('アイコン生成完了！');
