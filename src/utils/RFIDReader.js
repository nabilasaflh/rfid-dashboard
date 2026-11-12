let port = null;
let scanning = false;
let writing = false;
let activeReader = null;

const CONFIG = {
  baudRate: 57600,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
};

const INVENTORY = new Uint8Array([
  0x06, 0xff, 0x01, 0x04, 0x00, 0x7e, 0xf3,
]);

const toHex = bytes =>
  Array.from(
    bytes,
    byte => byte.toString(16).padStart(2, "0").toUpperCase()
  ).join("");

const validateEPC = value => {
  const epc = String(value ?? "")
    .replace(/\s/g, "")
    .toUpperCase();

  if (!/^(?:[0-9A-F]{4}){1,31}$/.test(epc)) {
    throw new Error(
      "EPC harus berupa HEX dengan panjang kelipatan 4, maksimal 124 karakter."
    );
  }

  return epc;
};

function crc16(data) {
  let crc = 0xffff;

  for (const byte of data) {
    crc ^= byte;

    for (let i = 0; i < 8; i++) {
      crc = crc & 1
        ? (crc >>> 1) ^ 0x8408
        : crc >>> 1;
    }
  }

  return crc & 0xffff;
}

function buildWriteEPCFrame(newValue, oldValue) {
  const newEPC = validateEPC(newValue);
  const oldEPC = validateEPC(oldValue);

  const newBytes = newEPC.match(/.{2}/g)
    .map(value => parseInt(value, 16));

  const oldBytes = oldEPC.match(/.{2}/g)
    .map(value => parseInt(value, 16));

  const oldWords = oldBytes.length / 2;
  const newWords = newBytes.length / 2;

  const body = [
    oldWords,
    newWords,
    ...oldBytes,
    0x01,
    0x02,
    ...newBytes,
    0x00,
    0x00,
    0x00,
    0x00
  ];

  const packet = [
    body.length + 4,
    0x00,
    0x03,
    ...body
  ];

  const crc = crc16(packet);

  packet.push(
    crc & 0xff,
    (crc >> 8) & 0xff
  );

  return new Uint8Array(packet);
}

function findWriteResponse(buffer) {
  for (let i = 0; i <= buffer.length - 6; i++) {
    if (
      buffer[i] !== 0x05 ||
      buffer[i + 1] !== 0x00 ||
      buffer[i + 2] !== 0x03
    ) {
      continue;
    }

    const frame = buffer.slice(i, i + 6);

    const receivedCRC =
      frame[4] | (frame[5] << 8);

    const calculatedCRC = crc16(
      frame.slice(0, 4)
    );

    if (receivedCRC !== calculatedCRC) {
      continue;
    }

    return {
      status: frame[3],
      frame,
    };
  }

  return null;
}

async function readWriteResponse(reader) {
  let buffer = new Uint8Array(0);

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      throw new Error(
        "Reader terputus sebelum respons WRITE diterima."
      );
    }

    if (!value?.length) continue;

    const merged = new Uint8Array(
      buffer.length + value.length
    );

    merged.set(buffer);
    merged.set(value, buffer.length);

    buffer = merged;

    const response = findWriteResponse(buffer);

    if (response) {
      return response;
    }

    if (buffer.length > 256) {
      buffer = buffer.slice(-32);
    }
  }
}

export async function connectRFIDReader() {
  if (!("serial" in navigator)) {
    throw new Error(
      "Browser tidak mendukung Web Serial."
    );
  }

  if (port?.readable && port?.writable) {
    return port;
  }

  const ports = await navigator.serial.getPorts();

  port = ports[0] ||
    await navigator.serial.requestPort();

  await port.open(CONFIG);

  return port;
}

export async function writeRFID(
  newValue,
  oldValue,
  timeoutMs = 3000
) {
  if (scanning || writing) {
    throw new Error("Reader sedang digunakan.");
  }

  const newEPC = validateEPC(newValue);
  const oldEPC = validateEPC(oldValue);

  const frame = buildWriteEPCFrame(
    newEPC,
    oldEPC
  );

  const started = performance.now();

  writing = true;

  let reader = null;
  let writer = null;
  let responsePromise = null;
  let timeoutId = null;
  let responseReceived = false;

  try {
    await connectRFIDReader();

    reader = port.readable.getReader();
    writer = port.writable.getWriter();

    activeReader = reader;

    console.log("[WRITE] EPC lama:", oldEPC);
    console.log("[WRITE] EPC baru:", newEPC);
    console.log("[WRITE] TX:", toHex(frame));

    responsePromise = readWriteResponse(reader);

    const operationPromise = (async () => {
      await writer.write(frame);

      console.log("[WRITE] Perintah terkirim.");

      return await responsePromise;
    })();

    const response = await Promise.race([
      operationPromise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(
            new Error(`WRITE timeout setelah ${timeoutMs} ms.`)
          ),
          timeoutMs
        );
      }),
    ]);

    responseReceived = true;

    console.log("[WRITE] RX:", toHex(response.frame));

    const errors = {
      0xfa: "Komunikasi dengan tag gagal.",
      0xfb: "Tag tidak ditemukan atau EPC lama tidak cocok.",
      0xfc: "Tag mengembalikan kode error.",
      0xfd: "Panjang perintah salah.",
      0xfe: "Perintah atau CRC tidak valid.",
      0xff: "Parameter perintah tidak valid.",
    };

    if (response.status !== 0x00) {
      const code = response.status
        .toString(16)
        .toUpperCase()
        .padStart(2, "0");

      throw new Error(
        `WRITE gagal (${code}): ${
          errors[response.status] || "Status tidak dikenali."
        }`
      );
    }

    console.log("[WRITE] ACK berhasil diterima.");

    return {
      success: true,
      acknowledged: true,
      verified: false,
      epc: newEPC,
    };

  } finally {
    clearTimeout(timeoutId);

    if (reader) {
      if (!responseReceived) {
        try {
          await reader.cancel();
        } catch {}

        try {
          await responsePromise?.catch(() => {});
        } catch {}
      }

      try {
        reader.releaseLock();
      } catch {}
    }

    try {
      writer?.releaseLock();
    } catch {}

    activeReader = null;
    writing = false;

    console.log(
      `[WRITE] Durasi: ${
        ((performance.now() - started) / 1000).toFixed(2)
      } detik`
    );
  }
}

export async function scanRFID(
  timeoutMs = 5000,
  mode = "xerafy"
) {
  if (scanning || writing) {
    throw new Error("Reader sedang digunakan.");
  }

  scanning = true;

  let reader, writer, retry, timeout;

  try {
    await connectRFIDReader();

    reader = port.readable.getReader();
    writer = port.writable.getWriter();

    activeReader = reader;

    return await new Promise((resolve, reject) => {
      let buffer = new Uint8Array(0);
      let done = false;

      const finish = (value, error) => {
        if (done) return;

        done = true;

        clearInterval(retry);
        clearTimeout(timeout);

        if (error || value === null) {
          reader.cancel().catch(() => {});
        }

        error
          ? reject(error)
          : resolve(value);
      };

      const send = () => {
        if (!done) {
          writer.write(INVENTORY)
            .catch(error => finish(null, error));
        }
      };

      send();

      retry = setInterval(send, 500);

      timeout = setTimeout(
        () => finish(null),
        timeoutMs
      );

      (async () => {
        try {
          while (!done) {
            const {
              value,
              done: ended,
            } = await reader.read();

            if (ended) break;
            if (!value?.length) continue;

            console.log("[RFID] RX:", toHex(value));

            const merged = new Uint8Array(
              buffer.length + value.length
            );

            merged.set(buffer);
            merged.set(value, buffer.length);

            buffer = merged;

            while (buffer.length >= 8) {
              if (
                buffer[0] === 0x07 &&
                buffer[1] === 0x00 &&
                buffer[2] === 0x01
              ) {
                buffer = buffer.slice(8);
                continue;
              }

              let foundIndex = -1;
              let epcLength = 0;
              let frameLength = 0;

              for (let i = 0; i <= buffer.length - 7; i++) {
                const validHeader =
                  buffer[i + 1] === 0x00 &&
                  buffer[i + 2] === 0x01 &&
                  buffer[i + 3] === 0x01 &&
                  buffer[i + 4] === 0x01 &&
                  buffer[i + 5] === 0x01;

                if (!validHeader) continue;

                const length = buffer[i + 6];
                const totalLength = buffer[i] + 1;

                if (
                  length < 2 ||
                  length > 62 ||
                  length % 2 !== 0 ||
                  totalLength < 7 + length + 2
                ) {
                  continue;
                }

                foundIndex = i;
                epcLength = length;
                frameLength = totalLength;
                break;
              }

              if (foundIndex === -1) {
                buffer = buffer.slice(-7);
                break;
              }

              if (buffer.length - foundIndex < frameLength) {
                buffer = buffer.slice(foundIndex);
                break;
              }

              const epc = toHex(
                buffer.slice(
                  foundIndex + 7,
                  foundIndex + 7 + epcLength
                )
              );

              buffer = buffer.slice(foundIndex + frameLength);

              if (epc && !/^0+$/.test(epc)) {
                console.log("[RFID] EPC:", epc);
                finish(epc);
                return;
              }
            }

            if (
              mode === "sticker" &&
              buffer.length >= 8
            ) {
              const text = new TextDecoder()
                .decode(buffer)
                .replace(/\0/g, "")
                .trim();

              if (/^[\x20-\x7E]+$/.test(text)) {
                finish(text);
                return;
              }
            }
          }

          finish(null);

        } catch (error) {
          finish(null, error);
        }
      })();
    });

  } finally {
    clearInterval(retry);
    clearTimeout(timeout);

    try {
      reader?.releaseLock();
    } catch {}

    try {
      writer?.releaseLock();
    } catch {}

    activeReader = null;
    scanning = false;
  }
}

export const scanXerafy = (t = 5000) =>
  scanRFID(t, "xerafy");

export const scanSticker = (t = 5000) =>
  scanRFID(t, "sticker");

export async function stopRFIDScan() {
  try {
    await activeReader?.cancel();
  } catch {}
}

export async function disconnectRFIDReader() {
  await stopRFIDScan();

  while (scanning || writing) {
    await new Promise(resolve =>
      setTimeout(resolve, 50)
    );
  }

  try {
    if (port?.readable && port?.writable) {
      await port.close();
    }
  } catch (error) {
    console.error(
      "[RFID] Gagal menutup port:",
      error
    );
  }

  port = null;
}

export async function getRFIDReaderInfo() {
  return {
    connected: Boolean(
      port?.readable && port?.writable
    ),
    baudRate: CONFIG.baudRate,
  };
}

export const isRFIDConnected = () =>
  Boolean(port?.readable && port?.writable);

export const isRFIDScanning = () => scanning;
