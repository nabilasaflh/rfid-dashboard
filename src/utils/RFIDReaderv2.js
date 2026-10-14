
/**
 * Rapid Access UHF Gen 2 RFID Reader
 * Frequency: 923-925 MHz
 * Web Serial API
 *
 * Features:
 * - Detailed diagnostic logging
 * - Connection and port information
 * - TX/RX HEX logs
 * - Buffer and frame parsing logs
 * - EPC candidate detection
 * - Automatic retry
 * - Timeout handling
 * - Stop and disconnect
 * - Error stack logging
 *
 * IMPORTANT:
 * Serial command and EPC frame format are inherited
 * from the original code and are not yet verified
 * against the manufacturer's protocol documentation.
 */

// =====================================================
// GLOBAL STATE
// =====================================================

let port = null;
let scanning = false;
let stopRequested = false;

let activeReader = null;
let activeScanPromise = null;
let activeStop = null;
let connectionPromise = null;

let scanCounter = 0;

const CONFIG = {
  baudRate: 57600,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
};

const COMMAND = Uint8Array.from([
  0x06, 0xff, 0x01, 0x04, 0x00, 0x7e, 0xf3,
]);

const SETTINGS = {
  timeout: 15000,
  retryInterval: 1000,
  maxBufferSize: 4096,
  debug: true,
};

const FRAME_HEADER = Uint8Array.from([
  0x15, 0x00, 0x01, 0x01,
  0x01, 0x01, 0x0c, 0x00,
]);

const FRAME_LENGTH = 22;

// =====================================================
// LOGGER
// =====================================================

const LEVEL_STYLES = {
  INFO: "color:#2563eb;font-weight:bold",
  CONNECT: "color:#0891b2;font-weight:bold",
  TX: "color:#9333ea;font-weight:bold",
  RX: "color:#0d9488;font-weight:bold",
  BUFFER: "color:#64748b;font-weight:bold",
  PARSE: "color:#d97706;font-weight:bold",
  SUCCESS: "color:#16a34a;font-weight:bold",
  WARN: "color:#ea580c;font-weight:bold",
  ERROR: "color:#dc2626;font-weight:bold",
  STOP: "color:#64748b;font-weight:bold",
};

function timestamp() {
  return new Date().toLocaleTimeString("id-ID", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function log(level, message, data) {
  if (!SETTINGS.debug && level !== "ERROR") {
    return;
  }

  const prefix = `[${timestamp()}] [RFID] [${level}]`;
  const style = LEVEL_STYLES[level] || "";

  const method =
    level === "ERROR" ? "error" :
    level === "WARN" ? "warn" :
    "log";

  if (data !== undefined) {
    console[method](
      `%c${prefix} ${message}`,
      style,
      data
    );
  } else {
    console[method](
      `%c${prefix} ${message}`,
      style
    );
  }
}

function logError(context, error) {
  log("ERROR", context, {
    name: error?.name || "UnknownError",
    message: error?.message || String(error),
    stack: error?.stack || null,
    currentStatus: {
      connected: Boolean(port?.readable && port?.writable),
      scanning,
      stopRequested,
    },
  });
}

// =====================================================
// HELPERS
// =====================================================

function toHex(bytes, separator = " ") {
  return Array.from(bytes, byte =>
    byte.toString(16).padStart(2, "0")
  ).join(separator).toUpperCase();
}

function concatBytes(a, b) {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findHeader(buffer) {
  for (
    let i = 0;
    i <= buffer.length - FRAME_HEADER.length;
    i++
  ) {
    let matched = true;

    for (let j = 0; j < FRAME_HEADER.length; j++) {
      if (buffer[i + j] !== FRAME_HEADER[j]) {
        matched = false;
        break;
      }
    }

    if (matched) return i;
  }

  return -1;
}

// =====================================================
// FRAME PARSER
// =====================================================

function parseRFIDFrame(frame, scanId) {
  const rawHex = toHex(frame);

  log("PARSE", `Scan #${scanId}: Checking frame`, {
    length: frame.length,
    hex: rawHex,
  });

  if (frame.length !== FRAME_LENGTH) {
    log("WARN", "Frame length mismatch", {
      expected: FRAME_LENGTH,
      received: frame.length,
    });

    return null;
  }

  for (let i = 0; i < FRAME_HEADER.length; i++) {
    if (frame[i] !== FRAME_HEADER[i]) {
      log("WARN", "Frame header mismatch", {
        byteIndex: i,
        expected: FRAME_HEADER[i],
        received: frame[i],
      });

      return null;
    }
  }

  // Legacy extraction based on original code:
  // hex.slice(16, 38) => bytes 8 through 18.
  const epcBytes = frame.slice(8, 19);
  const epc = toHex(epcBytes, "");

  log("PARSE", "Legacy EPC candidate extracted", {
    epc,
    epcLengthBytes: epcBytes.length,
    offsetStart: 8,
    offsetEndExclusive: 19,
    rawFrame: rawHex,
    protocolVerified: false,
  });

  if (epcBytes.length !== 11) {
    log("WARN", "Unexpected legacy EPC length");
    return null;
  }

  if (!/^[0-9A-F]{22}$/.test(epc)) {
    log("WARN", "Invalid hexadecimal EPC candidate");
    return null;
  }

  if (/^0+$/.test(epc)) {
    log("WARN", "EPC candidate contains only zeros");
    return null;
  }

  return epc;
}

function parseRFIDBuffer(buffer, scanId) {
  log("BUFFER", `Scan #${scanId}: Processing buffer`, {
    bytes: buffer.length,
    hex: toHex(buffer),
  });

  while (buffer.length >= FRAME_HEADER.length) {
    const headerIndex = findHeader(buffer);

    if (headerIndex === -1) {
      log("PARSE", "Known frame header not found", {
        expectedHeader: toHex(FRAME_HEADER),
        received: toHex(buffer),
        explanation:
          "Response might use another protocol or contain a partial header.",
      });

      return {
        epc: null,
        buffer: buffer.slice(-(FRAME_HEADER.length - 1)),
      };
    }

    if (headerIndex > 0) {
      log("WARN", "Bytes before known frame header", {
        discardedBytes: headerIndex,
        discardedHex: toHex(buffer.slice(0, headerIndex)),
      });

      buffer = buffer.slice(headerIndex);
    }

    if (buffer.length < FRAME_LENGTH) {
      log("PARSE", "Waiting for remaining frame bytes", {
        received: buffer.length,
        expected: FRAME_LENGTH,
        missing: FRAME_LENGTH - buffer.length,
      });

      return { epc: null, buffer };
    }

    const frame = buffer.slice(0, FRAME_LENGTH);

    const epc = parseRFIDFrame(frame, scanId);

    buffer = buffer.slice(FRAME_LENGTH);

    if (epc) {
      log("SUCCESS", "Legacy frame matched", {
        epcCandidate: epc,
        protocolVerified: false,
      });

      return { epc, buffer };
    }

    log("WARN", "Frame rejected; continuing parsing");
  }

  return { epc: null, buffer };
}

// =====================================================
// CONNECT
// =====================================================

export async function connectRFIDReader() {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    log("CONNECT", "Starting connection process");

    if (!("serial" in navigator)) {
      const error = new Error(
        "Web Serial API tidak tersedia. Gunakan Chrome/Edge pada HTTPS atau localhost."
      );

      logError("Web Serial unsupported", error);
      throw error;
    }

    if (port?.readable && port?.writable) {
      log("CONNECT", "Reader already connected");
      return port;
    }

    try {
      if (!port) {
        const availablePorts = await navigator.serial.getPorts();

        log("CONNECT", "Authorized serial ports found", {
          count: availablePorts.length,
          ports: availablePorts.map(p => p.getInfo()),
        });

        if (availablePorts.length === 1) {
          port = availablePorts[0];
        } else {
          log("CONNECT", "Requesting user to select serial port");
          port = await navigator.serial.requestPort();
        }
      }

      log("CONNECT", "Selected port information", port.getInfo());
      log("CONNECT", "Opening serial port", CONFIG);

      await port.open(CONFIG);

      log("SUCCESS", "Serial connection established", {
        portInfo: port.getInfo(),
        baudRate: CONFIG.baudRate,
        readable: Boolean(port.readable),
        writable: Boolean(port.writable),
      });

      return port;

    } catch (error) {
      logError("Connection failed", error);
      port = null;
      throw error;
    }
  })();

  try {
    return await connectionPromise;
  } finally {
    connectionPromise = null;
  }
}

// =====================================================
// SCAN
// =====================================================

export async function scanRFID(
  timeoutMs = SETTINGS.timeout
) {
  if (scanning) {
    const error = new Error("Scan RFID sedang berjalan.");
    logError("Duplicate scan prevented", error);
    throw error;
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    const error = new Error("Invalid RFID scan timeout");
    logError("Invalid configuration", error);
    throw error;
  }

  scanning = true;
  stopRequested = false;

  const scanId = ++scanCounter;
  const startedAt = Date.now();

  let reader = null;
  let writer = null;

  let retryTimer = null;
  let timeoutTimer = null;

  let readTask = null;
  let buffer = new Uint8Array(0);

  let finished = false;
  let resolveResult;
  let rejectResult;

  let txCount = 0;
  let rxCount = 0;
  let totalRxBytes = 0;

  let writeQueue = Promise.resolve();

  const resultPromise = new Promise((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  // Prevent unhandled promise rejection when
  // initialization fails before awaiting the result.
  resultPromise.catch(() => {});

  function finish(epc = null, error = null, reason = "completed") {
    if (finished) return;

    finished = true;
    stopRequested = true;

    clearInterval(retryTimer);
    clearTimeout(timeoutTimer);

    const elapsed = Date.now() - startedAt;

    log(error ? "ERROR" : epc ? "SUCCESS" : "STOP",
      `Scan #${scanId} finished`, {
        reason,
        epcCandidate: epc,
        elapsedMs: elapsed,
        txCount,
        rxCount,
        totalRxBytes,
        remainingBuffer: toHex(buffer),
      }
    );

    if (reader) {
      reader.cancel().catch(cancelError => {
        logError("Reader cancel failed", cancelError);
      });
    }

    if (error) {
      rejectResult(error);
    } else {
      resolveResult(epc);
    }
  }

  activeStop = () => {
    finish(null, null, "manual_stop");
  };

  function sendCommand() {
    if (finished || stopRequested || !writer) {
      return;
    }

    writeQueue = writeQueue
      .then(async () => {
        if (finished || stopRequested) return;

        const nextAttempt = txCount + 1;

        log("TX", `Scan #${scanId}: Sending inventory command`, {
          attempt: nextAttempt,
          length: COMMAND.length,
          hex: toHex(COMMAND),
        });

        await writer.write(COMMAND);

        txCount++;

        log("TX", `Scan #${scanId}: Command write completed`, {
          attempt: txCount,
        });
      })
      .catch(error => {
        if (!finished) {
          logError("Serial command transmission failed", error);
          finish(null, error, "write_error");
        }
      });
  }

  try {
    log("INFO", `========== RFID SCAN #${scanId} START ==========`, {
      timeoutMs,
      retryInterval: SETTINGS.retryInterval,
      baudRate: CONFIG.baudRate,
      command: toHex(COMMAND),
      expectedHeader: toHex(FRAME_HEADER),
      expectedFrameLength: FRAME_LENGTH,
    });

    await connectRFIDReader();

    if (stopRequested || finished) {
      return null;
    }

    reader = port.readable.getReader();
    activeReader = reader;

    writer = port.writable.getWriter();

    log("INFO", "Serial reader and writer locks acquired");

    readTask = (async () => {
      try {
        while (!finished && !stopRequested) {
          log("INFO", `Scan #${scanId}: Waiting for serial response`);

          const { value, done } = await reader.read();

          if (done) {
            log("WARN", "Serial readable stream ended");
            finish(null, null, "stream_ended");
            break;
          }

          if (!value?.length) continue;

          rxCount++;
          totalRxBytes += value.length;

          log("RX", `Scan #${scanId}: Received serial data`, {
            chunkNumber: rxCount,
            length: value.length,
            hex: toHex(value),
            rawBytes: Array.from(value),
          });

          const previousBufferLength = buffer.length;

          buffer = concatBytes(buffer, value);

          log("BUFFER", "Serial data appended", {
            previousBytes: previousBufferLength,
            incomingBytes: value.length,
            totalBytes: buffer.length,
          });

          if (buffer.length > SETTINGS.maxBufferSize) {
            log("WARN", "Buffer size limit exceeded", {
              limit: SETTINGS.maxBufferSize,
              actual: buffer.length,
            });

            buffer = buffer.slice(-SETTINGS.maxBufferSize);
          }

          const parsed = parseRFIDBuffer(buffer, scanId);
          buffer = parsed.buffer;

          if (parsed.epc) {
            log("SUCCESS", "RFID candidate detected", {
              epc: parsed.epc,
              protocolVerified: false,
              note:
                "Verify EPC against a known tag before production use.",
            });

            finish(parsed.epc, null, "tag_detected");
            break;
          }
        }
      } catch (error) {
        if (!finished) {
          logError("Serial receive/read loop failed", error);
          finish(null, error, "read_error");
        }
      }
    })();

    timeoutTimer = setTimeout(() => {
      if (rxCount === 0) {
        log("WARN", "Timeout: no serial data received", {
          txCount,
          timeoutMs,
          possibleCauses: [
            "Wrong baud rate",
            "Incorrect inventory command",
            "Incorrect serial port",
            "Device communication problem",
          ],
        });
      } else {
        log("WARN", "Timeout: received data but no recognized EPC frame", {
          rxCount,
          totalRxBytes,
          bufferHex: toHex(buffer),
          possibleCauses: [
            "Unexpected response protocol",
            "Frame structure mismatch",
            "Incomplete serial response",
            "No tag detected",
          ],
        });
      }

      finish(null, null, "timeout");
    }, timeoutMs);

    sendCommand();

    retryTimer = setInterval(() => {
      if (!finished) {
        log("INFO", `Scan #${scanId}: Inventory retry`);
        sendCommand();
      }
    }, SETTINGS.retryInterval);

    activeScanPromise = resultPromise;

    return await resultPromise;

  } catch (error) {
    logError(`Scan #${scanId} failed`, error);

    if (!finished) {
      finish(null, error, "exception");
    }

    throw error;

  } finally {
    finished = true;
    stopRequested = true;

    clearInterval(retryTimer);
    clearTimeout(timeoutTimer);

    log("INFO", `Scan #${scanId}: Starting cleanup`);

    if (reader) {
      try {
        await reader.cancel();
      } catch (error) {
        logError("Reader cancellation failed", error);
      }
    }

    if (readTask) {
      try {
        await readTask;
      } catch (error) {
        logError("Read task cleanup failed", error);
      }
    }

    try {
      await writeQueue;
    } catch (error) {
      logError("Write queue cleanup failed", error);
    }

    try {
      reader?.releaseLock();
      log("INFO", "Reader lock released");
    } catch (error) {
      logError("Reader lock release failed", error);
    }

    try {
      writer?.releaseLock();
      log("INFO", "Writer lock released");
    } catch (error) {
      logError("Writer lock release failed", error);
    }

    activeReader = null;
    activeScanPromise = null;
    activeStop = null;
    scanning = false;

    log("INFO", `========== RFID SCAN #${scanId} END ==========`);
  }
}

// =====================================================
// STOP SCAN
// =====================================================

export async function stopRFIDScan() {
  log("STOP", "Manual stop requested");

  stopRequested = true;

  if (activeStop) {
    activeStop();
  }

  if (activeReader) {
    try {
      await activeReader.cancel();
      log("STOP", "Active reader canceled");
    } catch (error) {
      logError("Failed to cancel active reader", error);
    }
  }

  if (activeScanPromise) {
    try {
      await activeScanPromise;
    } catch {
      // The original scan may already have failed.
    }
  }
}

// =====================================================
// DISCONNECT
// =====================================================

export async function disconnectRFIDReader() {
  log("CONNECT", "Disconnect requested");

  await stopRFIDScan();

  while (scanning) {
    await sleep(25);
  }

  if (!port) {
    log("INFO", "No serial port to disconnect");
    return;
  }

  try {
    log("CONNECT", "Closing serial port");

    if (port.readable || port.writable) {
      await port.close();
    }

    log("SUCCESS", "RFID serial port disconnected");
    port = null;

  } catch (error) {
    logError("RFID disconnect failed", error);
    throw error;
  }
}

// =====================================================
// STATUS AND SETTINGS
// =====================================================

export function isRFIDConnected() {
  return Boolean(port?.readable && port?.writable);
}

export function isRFIDScanning() {
  return scanning;
}

export function getRFIDStatus() {
  return {
    connected: isRFIDConnected(),
    scanning,
    stopRequested,
    baudRate: CONFIG.baudRate,
    retryInterval: SETTINGS.retryInterval,
    debugEnabled: SETTINGS.debug,
    scanCount: scanCounter,
  };
}

export function setRFIDDebug(enabled = true) {
  SETTINGS.debug = Boolean(enabled);

  log("INFO", "RFID debug mode updated", {
    enabled: SETTINGS.debug,
  });
}
