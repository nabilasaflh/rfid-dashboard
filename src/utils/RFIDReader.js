let port = null;
let scanning = false;
let stopRequested = false;

const CONFIG = {
  baudRate: 57600,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
};

const COMMAND = new Uint8Array([
  0x06, 0xff, 0x01, 0x04, 0x00, 0x7e, 0xf3,
]);

const toHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

export async function connectRFIDReader() {
  if (!("serial" in navigator)) {
    throw new Error("Browser tidak mendukung Web Serial API.");
  }

  if (port?.readable && port?.writable) return port;

  const ports = await navigator.serial.getPorts();
  port = ports[0] || await navigator.serial.requestPort();

  if (!port.readable || !port.writable) {
    await port.open(CONFIG);
  }

  return port;
}

export async function scanRFID(timeoutMs = 15000) {
  if (scanning) throw new Error("Scan sedang berjalan.");

  scanning = true;
  stopRequested = false;

  let reader;
  let writer;
  let retryTimer;
  let timeoutTimer;

  try {
    await connectRFIDReader();

    reader = port.readable.getReader();
    writer = port.writable.getWriter();

    let buffer = new Uint8Array(0);

    await writer.write(COMMAND);
    console.log("Perintah scan RFID dikirim.");

    retryTimer = setInterval(() => {
      if (!stopRequested) {
        writer.write(COMMAND).catch(console.error);
      }
    }, 1000);

    return await new Promise((resolve, reject) => {
      let finished = false;

      const finish = (result, error) => {
        if (finished) return;
        finished = true;

        clearInterval(retryTimer);
        clearTimeout(timeoutTimer);
        reader.cancel().catch(() => {});

        error ? reject(error) : resolve(result);
      };

      timeoutTimer = setTimeout(() => finish(null), timeoutMs);

      (async () => {
        try {
          while (!finished && !stopRequested) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!value?.length) continue;

            console.log("RFID RX:", toHex(value));

            const merged = new Uint8Array(buffer.length + value.length);
            merged.set(buffer);
            merged.set(value, buffer.length);
            buffer = merged;           

for (let i = 0; i + 22 <= buffer.length; i++) {
  const frame = buffer.slice(i, i + 22);
  const hex = toHex(frame);

  if (hex.startsWith("1500010101010C00")) {
    console.log("FRAME RFID DITEMUKAN:", hex);

    const epc = hex.slice(16, 38);

console.log("EPC terdeteksi:", epc);
finish(epc);
return;

    // Belum mengembalikan hasil sebelum format EPC terverifikasi
    buffer = buffer.slice(i + 22);
    break;
  }
}

            if (buffer.length > 256) {
              buffer = buffer.slice(-20);
            }
          }

          finish(null);
        } catch (error) {
          finish(null, error);
        }
      })();
    });
  } finally {
    clearInterval(retryTimer);
    clearTimeout(timeoutTimer);

    try {
      reader?.releaseLock();
    } catch {}

    try {
      writer?.releaseLock();
    } catch {}

    scanning = false;
  }
}

export async function stopRFIDScan() {
  stopRequested = true;
  try {
    await port?.readable?.cancel();
  } catch {}
}

export async function disconnectRFIDReader() {
  await stopRFIDScan();

  try {
    if (port?.readable && port?.writable) {
      await port.close();
    }
  } catch {}

  port = null;
}