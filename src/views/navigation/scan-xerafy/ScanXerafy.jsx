import { useEffect, useState } from 'react';

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

const btn = {
  height: 34,
  border: '1px solid #dfe5eb',
  borderRadius: 5,
  background: '#fff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  cursor: 'pointer'
};

export default function ScanXerafy() {
  const [data, setData] = useState([]);
  const [lastReload, setLastReload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [readerStatus, setReaderStatus] = useState('Disconnected');
  const [scanning, setScanning] = useState(false);

  // TAMBAHAN
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/scan-xerafy');

      if (!res.ok) throw new Error('Gagal mengambil data');

      setData(await res.json());
      setLastReload(new Date());
    } catch (error) {
      console.error('Gagal mengambil data scan Xerafy:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReader = async () => {
    try {
      const res = await fetch('http://localhost:5001/reader/status');
      const result = await res.json();
      setReaderStatus(result.connected ? 'Connected' : 'Disconnected');
    } catch {
      setReaderStatus('Disconnected');
    }
  };

  const startScan = async () => {
    try {
      const res = await fetch('http://localhost:5001/reader/start');
      if (!res.ok) throw new Error();
      setScanning(true);
    } catch {
      alert('RFID Bridge tidak terhubung.');
    }
  };

  const stopScan = async () => {
    try {
      await fetch('http://localhost:5001/reader/stop');
      setScanning(false);
    } catch (error) {
      console.error(error);
    }
  };

  // TAMBAHAN
  const deleteSelected = async () => {
    if (!selected.length) {
      alert('Pilih Xerafy yang ingin dihapus.');
      return;
    }

    if (!window.confirm(`Hapus ${selected.length} Xerafy yang dipilih?`)) {
      return;
    }

    try {
      setDeleting(true);

      for (const id of selected) {
        const res = await fetch(
          `http://localhost:5000/api/scan-xerafy/${id}`,
          {
            method: 'DELETE'
          }
        );

        const result = await res.json();

        if (!res.ok) {
          throw new Error(
            result.message || 'Gagal menghapus Xerafy'
          );
        }
      }

      setSelected([]);
      fetchData();
    } catch (error) {
      console.error('Gagal menghapus Xerafy:', error);
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchData();
    checkReader();

    const interval = setInterval(() => {
      fetchData();
      checkReader();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ fontSize: 14, color: '#455A64', marginBottom: 10 }}>
        Daftar Xerafy yang telah dipindai
      </div>

      <div style={reloadBar}>
        <span style={{ fontSize: 11, color: '#78909c' }}>
          Last Reload: {formatTime(lastReload)}
        </span>

        <button
          onClick={() => {
            fetchData();
            checkReader();
          }}
          disabled={loading}
          title="Reload"
          style={{ ...btn, width: 34, color: '#234F9A' }}
        >
          <i className="ti ti-refresh" />
        </button>
      </div>

      <div style={card}>
        {/* HEADER */}
        <div style={header}>
          <div style={titleArea}>
            <div style={iconBox}>
              <i className="ti ti-scan" />
            </div>

            <div>
              <div style={title}>Hasil Scan Xerafy</div>
              <div style={subtitle}>
                Xerafy yang berhasil dibaca oleh perangkat
              </div>
            </div>
          </div>

          <div style={scanArea}>
            <span
              style={{
                fontSize: 11,
                color:
                  readerStatus === 'Connected'
                    ? '#28a745'
                    : '#78909c'
              }}
            >
              ● Reader {readerStatus}
            </span>

            <button
              onClick={scanning ? stopScan : startScan}
              disabled={readerStatus !== 'Connected'}
              style={{
                ...scanBtn,
                background: scanning ? '#dc3545' : '#234F9A',
                cursor:
                  readerStatus === 'Connected'
                    ? 'pointer'
                    : 'not-allowed'
              }}
            >
              <i
                className={
                  scanning ? 'ti ti-player-stop' : 'ti ti-scan'
                }
                style={{ marginRight: 4 }}
              />
              {scanning ? 'Stop Scan' : 'Scan Xerafy'}
            </button>
          </div>
        </div>

        {/* TAMBAHAN TOMBOL HAPUS */}
        <div style={deleteArea}>
          <button
            onClick={deleteSelected}
            disabled={!selected.length || deleting}
            style={{
              ...deleteBtn,
              opacity: !selected.length || deleting ? 0.5 : 1,
              cursor:
                !selected.length || deleting
                  ? 'not-allowed'
                  : 'pointer'
            }}
          >
            <i className="ti ti-trash" style={{ marginRight: 5 }} />
            {deleting
              ? 'Menghapus...'
              : `Hapus${selected.length ? ` (${selected.length})` : ''}`}
          </button>
        </div>

        {/* TABLE */}
        <div style={tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#eaf0f7' }}>
                {/* TAMBAHAN */}
                <th style={head}>Pilih</th>

                {['No', 'RFID Sementara', 'Waktu Scan', 'Status'].map(
                  (title) => (
                    <th key={title} style={head}>
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="5" style={empty}>
                    Belum ada Xerafy yang dipindai
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id ?? index}>
                    {/* TAMBAHAN CHECKBOX */}
                    <td style={cell}>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        disabled={item.status === 'USED'}
                        onChange={() =>
                          setSelected((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id]
                          )
                        }
                      />
                    </td>

                    <td style={cell}>{index + 1}</td>
                    <td style={cell}>{item.rfid ?? '-'}</td>
                    <td style={cell}>
                      {formatTime(item.scanned_at)}
                    </td>
                    <td style={cell}>
                      {item.status === 'USED'
                        ? 'Sudah digunakan'
                        : 'Siap digunakan'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={info}>
          Xerafy yang sudah dipindai akan tersedia untuk proses pairing
          pada halaman RFID Tag Request.
        </div>
      </div>
    </div>
  );
}

const reloadBar = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 10,
  marginBottom: 15
};

const card = {
  background: '#fff',
  border: '1px solid #e8edf2',
  borderRadius: 8,
  padding: 22,
  boxShadow: '0 3px 12px rgba(0,0,0,0.07)'
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 18
};

const titleArea = {
  display: 'flex',
  alignItems: 'center',
  gap: 10
};

const iconBox = {
  width: 38,
  height: 38,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 7,
  background: '#eaf0f7',
  color: '#234F9A',
  fontSize: 20
};

const title = {
  fontSize: 13,
  fontWeight: 600,
  color: '#263238'
};

const subtitle = {
  fontSize: 11,
  color: '#78909c',
  marginTop: 3
};

const scanArea = {
  display: 'flex',
  alignItems: 'center',
  gap: 10
};

const scanBtn = {
  height: 34,
  padding: '0 12px',
  border: '1px solid #dfe5eb',
  borderRadius: 5,
  fontSize: '12px',
  color: '#fff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
};

// TAMBAHAN
const deleteArea = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: 10
};

const deleteBtn = {
  height: 34,
  padding: '0 12px',
  border: '1px solid #dc3545',
  borderRadius: 5,
  background: '#fff',
  color: '#dc3545',
  fontSize: 12,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
};

const tableWrap = {
  border: '1px solid #e8edf2',
  borderRadius: 6,
  overflow: 'hidden'
};

const head = {
  padding: 9,
  fontSize: 11,
  fontWeight: 600,
  color: '#263238',
  textAlign: 'center'
};

const cell = {
  padding: 8,
  textAlign: 'center',
  fontSize: 11,
  color: '#263238'
};

const empty = {
  padding: 25,
  textAlign: 'center',
  fontSize: 11,
  color: '#78909c'
};

const info = {
  marginTop: 18,
  paddingTop: 14,
  borderTop: '1px solid #eee',
  fontSize: 11,
  color: '#78909c'
};