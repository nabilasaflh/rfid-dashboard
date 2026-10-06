import { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import QRCode from 'qrcode';

const API = 'http://localhost:5000';

const LABEL = {
  UNPAIRED: 'Unpaired', PARTIALLY_PAIRED: 'Partially Paired',
  PAIRED: 'Paired', PARTIALLY_PRINTED: 'Partially Printed',
  PRINTED: 'Printed', COMPLETE: 'Complete'
};

const ACTIVE = Object.keys(LABEL).slice(0, 5);

const COLOR = {
  UNPAIRED: ['#fdecec', '#d32f2f'],
  PARTIALLY_PAIRED: ['#fff4e5', '#e65100'],
  PAIRED: ['#eaf0f7', '#234F9A'],
  PARTIALLY_PRINTED: ['#f3e8ff', '#7b1fa2'],
  PRINTED: ['#fff7d6', '#9a7600'],
  COMPLETE: ['#e8f5e9', '#2e7d32']
};

const input = {
  height: 36, padding: '0 10px', border: '1px solid #dfe3e8',
  borderRadius: 7, fontSize: 11
};

const cell = {
  padding: '6px 4px', color: '#263238', fontSize: 10,
  textAlign: 'center', verticalAlign: 'middle',
  overflow: 'hidden', wordBreak: 'break-word'
};

const button = {
  border: 'none', background: '#f1f5f9', color: '#234F9A',
  borderRadius: 5, padding: '5px 8px', margin: '0 2px',
  fontSize: 9, cursor: 'pointer'
};

const blue = { ...button, background: '#234F9A', color: '#fff' };

const formatTime = v => v ? new Date(v).toLocaleString('id-ID', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
}) : '-';

const Modal = ({ children }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: 20
  }}>
    <div style={{
      width: 480, maxWidth: '90%', maxHeight: '80vh',
      background: '#fff', borderRadius: 10, padding: 20, overflow: 'hidden'
    }}>
      {children}
    </div>
  </div>
);

const modalButtons = {
  display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 14
};

const cancel = {
  border: '1px solid #dfe3e8', background: '#fff',
  borderRadius: 6, padding: '7px 12px', fontSize: 11, cursor: 'pointer'
};

const detailRow = {
  display: 'flex', justifyContent: 'space-between', gap: 20,
  padding: '7px 0', borderBottom: '1px solid #eee', fontSize: 11
};

const empty = {
  textAlign: 'center', padding: 25, color: '#455A64'
};

export default function RFIDStickerRequest() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [pairing, setPairing] = useState(null);
  const [checking, setChecking] = useState(null);
  const [lastReload, setLastReload] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  const [readerConnected, setReaderConnected] = useState(false);

  const [copiedRFID, setCopiedRFID] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('copiedRFID') || '{}');
    } catch { return {}; }
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Sync data terbaru dari External API
      await fetch('http://localhost:5000/api/rfid/sync', {
        method: 'POST'
      });

      // Ambil data terbaru setelah sync
      const res = await fetch(
        'http://localhost:5000/api/sticker-request'
      );

      if (!res.ok) {
        throw new Error('Gagal mengambil data RFID Sticker');
      }

      const result = await res.json();
      setData(result);

      setLastReload(new Date());

    } catch (error) {
      console.error('Gagal mengambil data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
  const checkReader = async () => {
    try {
      const res = await fetch('http://localhost:5001/reader/status');
      const result = await res.json();
      setReaderConnected(result.connected === true);
    } catch {
      setReaderConnected(false);
    }
  };

  checkReader();
  const timer = setInterval(checkReader, 2000);
  return () => clearInterval(timer);
}, []);

  const copyRFID = async rfid => {
    if (!rfid) return;
    await navigator.clipboard.writeText(rfid);

    const next = { ...copiedRFID, [rfid]: true };
    setCopiedRFID(next);
    localStorage.setItem('copiedRFID', JSON.stringify(next));
  };

  const requests = Object.values(data.reduce((a, row) => {
    const key = `${row.doc_no}-${row.seq}`;

    if (!a[key]) a[key] = {
      id: key, doc_no: row.doc_no, seq: row.seq,
      location: row.loct_name || row.loct, category: row.ktgr,
      required: +row.jml_tag || 0, paired: 0, printed: 0,
      verified: 0, number_order: null, last_sync: null, rows: []
    };

    const x = a[key];
    x.rows.push(row);

    if (['PAIRED', 'PARTIALLY_PRINTED', 'PRINTED',
      'VERIFIED', 'COMPLETE'].includes(row.process_status)) x.paired++;

    if (['PRINTED', 'VERIFIED', 'COMPLETE'].includes(row.process_status)) x.printed++;
    if (['VERIFIED', 'COMPLETE'].includes(row.process_status)) x.verified++;

    if (row.number_order &&
      (!x.number_order || +row.number_order < +x.number_order))
      x.number_order = row.number_order;

    if (row.last_synced_at &&
      (!x.last_sync || new Date(row.last_synced_at) > new Date(x.last_sync)))
      x.last_sync = row.last_synced_at;

    return a;
  }, {}));

  requests.forEach(x => {
    x.status =
      !x.paired ? 'UNPAIRED' :
      x.paired < x.required ? 'PARTIALLY_PAIRED' :
      !x.printed ? 'PAIRED' :
      x.printed < x.required ? 'PARTIALLY_PRINTED' :
      x.verified < x.required ? 'PRINTED' : 'COMPLETE';
  });

  const filtered = requests.filter(x => {
    const q = search.toLowerCase();
    const found = !q || x.rows.some(r =>
      Object.values(r).some(v =>
        String(v ?? '').toLowerCase().includes(q)
      )
    );

    return found &&
      (status === 'ALL' || x.status === status) &&
      (location === 'ALL' || x.location === location) &&
      (!date || String(x.rows[0]?.tgl || '').includes(date));
  });

  const toggle = id => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    const all = filtered.length && filtered.every(x => selected.has(x.id));
    setSelected(all ? new Set() : new Set(filtered.map(x => x.id)));
  };

  const scanSticker = async () => {
  if (!readerConnected) {
    return alert('RFID reader tidak terhubung.');
  }

  if (selected.size !== 1) {
      return alert('Pilih satu kendaraan untuk melakukan scan RFID.');
    }

    const selectedRequest = filtered.find(
      x => selected.has(x.id)
    );

    if (!selectedRequest || !selectedRequest.rows.length) {
      return alert('Data kendaraan tidak ditemukan.');
    }

    const row = selectedRequest.rows[0];

    try {
      setScanning(true);
      setScanTarget(row);

      // Mulai reader
      await fetch('http://localhost:5001/reader/start', {
        method: 'POST'
      });

      alert(
        `Silakan tempelkan RFID Sticker ke reader untuk ${row.nopol || '-'}.`
      );

      let detected = null;

      for (let i = 0; i < 30; i++) {
        await new Promise(resolve =>
          setTimeout(resolve, 500)
        );

        const res = await fetch(
          'http://localhost:5001/reader/last'
        );

        if (!res.ok) continue;

        const result = await res.json();

        detected =
          result.rfid ||
          result.epc ||
          result.last_rfid ||
          result.lastEpc;

        if (detected) break;
      }

      await fetch('http://localhost:5001/reader/stop', {
        method: 'POST'
      });

      if (!detected) {
        setScanning(false);
        setScanTarget(null);

        return alert(
          'RFID tidak terbaca. Silakan coba scan ulang.'
        );
      }

      // Simpan sebagai RFID sementara
      const save = await fetch(
        `${API}/api/sticker/scan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: row.id,
            rfid: detected
          })
        }
      );

      const json = await save.json();

      if (!save.ok) {
        throw new Error(
          json.message || 'Gagal menyimpan hasil scan'
        );
      }

      alert(
        `RFID ${detected} berhasil discan untuk ${row.nopol || '-'}.`
      );

      setScanning(false);
      setScanTarget(null);

      await fetchData();

    } catch (error) {
      console.error('ERROR SCAN STICKER:', error);

      try {
        await fetch(
          'http://localhost:5001/reader/stop',
          { method: 'POST' }
        );
      } catch {}

      setScanning(false);
      setScanTarget(null);

      alert(error.message);
    }
  };

  const submitSticker = async () => {
    if (selected.size !== 1) {
      return alert('Pilih satu kendaraan untuk Submit.');
    }

    const selectedRequest = filtered.find(
      x => selected.has(x.id)
    );

    if (!selectedRequest || !selectedRequest.rows.length) {
      return alert('Data kendaraan tidak ditemukan.');
    }

    const row = selectedRequest.rows[0];

    if (!row.scanned_rfid) {
      return alert('RFID belum discan.');
    }

    try {
      const res = await fetch(
        `${API}/api/sticker/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: row.id
          })
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || 'Gagal submit RFID'
        );
      }

      alert('RFID berhasil didaftarkan.');

      setSelected(new Set());

      await fetchData();

    } catch (error) {
      console.error('ERROR SUBMIT STICKER:', error);
      alert(error.message);
    }
  };

  const copyStickerRFID = async row => {
    if (!row.rfid) {
      return alert('RFID belum diproses.');
    }

    try {
      await navigator.clipboard.writeText(row.rfid);

      const res = await fetch(
        `${API}/api/sticker/copy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: row.id
          })
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || 'Gagal memperbarui status'
        );
      }

      const next = {
        ...copiedRFID,
        [row.rfid]: true
      };

      setCopiedRFID(next);

      localStorage.setItem(
        'copiedRFID',
        JSON.stringify(next)
      );

      await fetchData();

    } catch (error) {
      console.error('ERROR COPY STICKER RFID:', error);
      alert(error.message);
    }
  };

  const pair = async () => {
    try {
      const res = await fetch(`${API}/api/rfid/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_no: pairing.doc_no })
      });

      const json = await res.json();
      if (!res.ok) throw Error(json.message || 'Pair gagal');

      alert(`RFID nomor urut ${json.number_order} berhasil dipasangkan.`);
      setPairing(null);
      fetchData();
    } catch (e) { alert(e.message); }
  };

  const verify = async () => {
    try {
      const res = await fetch(`${API}/api/rfid/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_no: checking.doc_no })
      });

      const json = await res.json();
      if (!res.ok) throw Error(json.message || 'Check gagal');

      alert('RFID berhasil diverifikasi.');
      setChecking(null);
      fetchData();
    } catch (e) { alert(e.message); }
  };

  const print = async items => {
  const rows = items.flatMap(x =>
    x.rows
  );

  if (!rows.length) return alert('Tidak ada data yang siap dicetak.');

    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return alert('Popup diblokir browser.');

    const printed = new Date().toLocaleString('id-ID');

    const stickers = await Promise.all(rows.map(async r => {
      const qr = await QRCode.toDataURL(
        `No Pol: ${r.nopol || '-'}\nTransporter: ${r.trnp || '-'}`,
        { width: 220, margin: 4 }
      );

      return `<div class="sticker">
        <img src="${qr}">
        <div class="circle">1 - 5</div>
        <div class="info">
          <b>${r.nopol || '-'}</b>
          <strong>${r.trnp || '-'}</strong>
          <span>Tgl Cetak: ${printed}</span>
        </div>
      </div>`;
    }));

    win.document.write(`<html><head><title>RFID Sticker</title>
      <style>
        @page{size:A4;margin:0}body{margin:30px;font-family:Arial}
        .sticker{width:720px;min-height:155px;margin:auto auto 28px;display:flex;
        align-items:center;gap:18px;page-break-inside:avoid}
        .sticker img{width:125px;height:125px}
        .circle{width:32px;height:32px;border:2px solid #222;border-radius:50%;
        display:flex;align-items:center;justify-content:center;font-size:10px;
        font-weight:bold;transform:translateY(-40px)}
        .info{text-align:center;min-width:350px}.info b{display:block;font-size:40px}
        .info strong{display:block;font-size:22px;margin:8px}
        .info span{font-size:18px;font-weight:bold}
      </style></head><body>${stickers.join('')}</body></html>`);

    win.document.close();
    win.onload = () => { win.focus(); win.print(); };

    win.onafterprint = async () => {
      await fetch(`${API}/api/rfid/mark-printed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: rows.map(r => r.id).filter(Boolean) })
      });
      setSelected(new Set());
      fetchData();
      win.close();
    };
  };

  const columns = [
    'No', 'Document Number', 'Sequence', 'Location', 'Category',
    'Required Tags', 'Paired Tags', 'Printed Tags', 'Status',
    'Nomor Urut', 'RFID', 'Last Sync', 'Action', 'Select'
  ];

  return <div>
    <div style={{ fontSize: 14, color: '#455A64', marginBottom: 10 }}>
      Monitoring permintaan RFID Sticker
    </div>

    <Card style={{ border: '1px solid #e1e5eb', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: 8, padding: '12px 20px', flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...input, width: 220 }}
        />

        <select value={status} onChange={e => setStatus(e.target.value)} style={input}>
          <option value="ALL">All Status</option>
          {ACTIVE.map(x => <option key={x} value={x}>{LABEL[x]}</option>)}
          <option value="COMPLETE">Complete</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={input}
        />

        <select value={location} onChange={e => setLocation(e.target.value)} style={input}>
          <option value="ALL">All Location</option>
          {[...new Set(requests.map(x => x.location))].filter(Boolean)
            .map(x => <option key={x}>{x}</option>)}
        </select>

        <button
          onClick={() => fetchData(true)}
          disabled={loading}
          style={{ ...button, width: 34, height: 34, padding: 0 }}
          title="Reload"
        >
          <i className="ti ti-refresh" />
        </button>

        <span style={{ fontSize: 10, color: '#607d8b' }}>
          {lastReload ? formatTime(lastReload) : '-'}
        </span>

        {selected.size === 1 && (
          <>
            <button
              onClick={scanSticker}
              disabled={scanning || !readerConnected}
              style={{...blue, background: readerConnected ? '#234F9A' : '#bdbdbd'}}
            >
              <i className="ti ti-rfid" />
              {scanning ? 'Scanning...' : 'Scan RFID'}
            </button>

            <button
              onClick={submitSticker}
              disabled={!readerConnected}
              style={{...blue, background: readerConnected ? '#2e7d32' : '#bdbdbd'}}
            >
              Submit
            </button>
          </>
        )}

        {selected.size > 0 && (
          <button
            onClick={() => print(filtered.filter(x => selected.has(x.id)))}
            style={{ ...blue, marginLeft: 'auto' }}
          >
            <i className="ti ti-printer" /> Print Selected ({selected.size})
          </button>
        )}
      </div>

      <div style={{
        maxHeight: 'calc(100vh - 250px)',
        overflowY: 'auto',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse'
        }}>
          <colgroup>
            {[3,10,5,7,7,6,6,6,8,6,13,7,13,3].map((w, i) =>
              <col key={i} style={{ width: `${w}%` }} />
            )}
          </colgroup>

          <thead>
            <tr>
              {columns.map((title, i) => (
                <th key={title} style={{
                  padding: '7px 3px',
                  background: '#eaf0f7',
                  color: '#263238',
                  textAlign: i === 1 ? 'left' : 'center',
                  fontSize: 10,
                  fontWeight: 600,
                  position: 'sticky',
                  top: 0,
                  zIndex: 5
                }}>
                  {title === 'Select' ? (
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 &&
                        filtered.every(x => selected.has(x.id))
                      }
                      onChange={toggleAll}
                    />
                  ) : title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="14" style={empty}>Loading...</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan="14" style={empty}>Data tidak ditemukan</td></tr>
            ) : filtered.map((x, i) => (
              <tr key={x.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={cell}>{i + 1}</td>
                <td style={{ ...cell, textAlign: 'left' }}>{x.doc_no || '-'}</td>
                <td style={cell}>{x.seq || '-'}</td>
                <td style={cell}>{x.location || '-'}</td>
                <td style={cell}>{x.category || '-'}</td>
                <td style={cell}>{x.required}</td>
                <td style={cell}>{x.paired}</td>
                <td style={cell}>{x.printed}</td>

                <td style={cell}>
                  <span style={{
                    padding: '4px 7px',
                    borderRadius: 12,
                    background: COLOR[x.status][0],
                    color: COLOR[x.status][1],
                    whiteSpace: 'nowrap'
                  }}>
                    {LABEL[x.status]}
                  </span>
                </td>

                <td style={cell}>{x.number_order || '-'}</td>

                <td style={cell}>
                  {x.status === 'UNPAIRED' ? '-' : x.rows.map(r => (r.scanned_rfid || r.rfid) && (
                    <div key={r.id} style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <span style={{
                        textDecoration: copiedRFID[r.rfid]
                          ? 'line-through' : 'none'
                      }}>
                        {r.scanned_rfid || r.rfid}
                      </span>

                      <button
                        onClick={() => copyRFID(r.rfid)}
                        style={{
                          ...button,
                          padding: '2px 4px',
                          fontSize: 8
                        }}
                        title="Copy RFID"
                      >
                        <i className="ti ti-copy" />
                      </button>
                    </div>
                  ))}
                </td>

                <td style={cell}>{formatTime(x.last_sync)}</td>

                <td style={cell}>
                  <button
                    onClick={() => setDetail(x)}
                    style={button}
                    title="Detail"
                  >
                    <i className="ti ti-eye" />
                  </button>

                  {['PAIRED', 'PARTIALLY_PRINTED'].includes(x.status) && (
                    <button
                      onClick={() => print([x])}
                      style={button}
                      title="Print"
                    >
                      <i className="ti ti-printer" />
                    </button>
                  )}

                  {x.status === 'PRINTED' && (
                    <button
                      onClick={() => setChecking(x)}
                      style={{
                        ...button,
                        background: '#fff7d6',
                        color: '#9a7600'
                      }}
                    >
                      Check
                    </button>
                  )}

                  {x.status !== 'COMPLETE' && x.paired < x.required && (
                    <button
                      onClick={() => setPairing(x)}
                      style={blue}
                    >
                      Pair
                    </button>
                  )}
                </td>

                <td style={cell}>
                  <input
                    type="checkbox"
                    checked={selected.has(x.id)}
                    onChange={() => toggle(x.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    {pairing && (
      <Modal>
        <h4>Pair RFID Sticker</h4>
        <p style={{ fontSize: 12 }}>
          Document: <b>{pairing.doc_no}</b>
        </p>

        <div style={{
          background: '#f5f7fa',
          padding: 15,
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <small>Nomor Urut RFID Berikutnya</small>
          <div style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#234F9A'
          }}>
            {pairing.next_number_order ?? '-'}
          </div>
        </div>

        <p style={{
          fontSize: 11,
          color: '#78909C',
          textAlign: 'center'
        }}>
          RFID diambil otomatis dari hasil scan yang belum dipasangkan.
        </p>

        <div style={modalButtons}>
          <button
            onClick={() => setPairing(null)}
            style={cancel}
          >
            Cancel
          </button>
          <button onClick={pair} style={blue}>
            Pair
          </button>
        </div>
      </Modal>
    )}

    {checking && (
      <Modal>
        <h4>Final RFID Check</h4>
        <p style={{ fontSize: 12 }}>
          Document: <b>{checking.doc_no}</b>
        </p>

        <p style={{ fontSize: 11 }}>
          Pastikan RFID yang sudah diprint sesuai sebelum menyelesaikan proses.
        </p>

        <div style={modalButtons}>
          <button
            onClick={() => setChecking(null)}
            style={cancel}
          >
            Cancel
          </button>

          <button
            onClick={verify}
            style={{ ...blue, background: '#2e7d32' }}
          >
            Verify
          </button>
        </div>
      </Modal>
    )}

    {detail && (
      <Modal>
        <h4>Detail Request</h4>

        <div style={{
          maxHeight: '60vh',
          overflow: 'auto'
        }}>
          {detail.rows.map((row, i) => (
            <div key={i}>
              {Object.entries(row)
                .filter(([key]) => key !== 'item_type')
                .map(([key, value]) => (
                  <div key={key} style={detailRow}>
                    <b style={{ color: '#263238' }}>{key}</b>
                    <span style={{ color: '#263238' }}>
                      {['rfid', 'printed_at'].includes(key) &&
                      ![
                        'PAIRED',
                        'PARTIALLY_PRINTED',
                        'PRINTED',
                        'VERIFIED',
                        'COMPLETE'
                      ].includes(row.process_status)
                        ? '-'
                        : value ?? '-'}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>

        <div style={modalButtons}>
          <button
            onClick={() => setDetail(null)}
            style={cancel}
          >
            Close
          </button>
        </div>
      </Modal>
    )}
  </div>;
}