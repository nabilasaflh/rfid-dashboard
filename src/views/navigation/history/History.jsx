import { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';

const API = 'http://localhost:5000';

const fields = [
  ['doc_no', 'Document Number'],
  ['ktgr', 'Category'],
  ['trnp', 'Transporter'],
  ['tgl', 'Tanggal'],
  ['nopol', 'No Pol'],
  ['merk', 'Merk'],
  ['jenis', 'Jenis'],
  ['warna', 'Warna'],
  ['thn', 'Tahun'],
  ['ton', 'Ton'],
  ['seq', 'Sequence'],
  ['jml_tag', 'Jumlah Tag'],
  ['loct_name', 'Location'],
  ['amount', 'Amount'],
  ['rfid', 'RFID'],
  ['last_synced_at', 'Last Sync']
];

const input = {
  height: 36, padding: '0 10px',
  border: '1px solid #dfe3e8',
  borderRadius: 7, fontSize: 11
};

const cell = {
  padding: '6px 4px',
  color: '#263238',
  fontSize: 10,
  textAlign: 'center',
  verticalAlign: 'middle',
  overflow: 'hidden',
  wordBreak: 'break-word'
};

const formatTime = v => v
  ? new Date(v).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  : '-';

export default function History() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('ALL');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastReload, setLastReload] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/rfid-with-status`);
      const result = await res.json();
      setData(result.filter(x => x.process_status === 'COMPLETE'));
      setLastReload(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const locations = [
    ...new Set(data.map(x => x.loct_name || x.loct).filter(Boolean))
  ];

  const filtered = data.filter(x => {
    const q = search.toLowerCase();
    const found = !q || Object.values(x).some(v =>
      String(v ?? '').toLowerCase().includes(q)
    );

    return found &&
      (location === 'ALL' || (x.loct_name || x.loct) === location) &&
      (!date || String(x.tgl ?? '').includes(date));
  });

  return (
    <div>
      <div style={{ fontSize: 14, color: '#455A64', marginBottom: 10 }}>
        Riwayat RFID yang telah selesai diproses
      </div>

      <Card style={{ border: '1px solid #e1e5eb', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: 8, padding: '12px 20px',
          flexWrap: 'wrap', alignItems: 'center'
        }}>
          <input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...input, width: 220 }}
          />

          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={input}
          >
            <option value="ALL">All Location</option>
            {locations.map(x => <option key={x}>{x}</option>)}
          </select>

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={input}
          />

          <button
            onClick={fetchData}
            disabled={loading}
            title="Reload"
            style={{
              border: 'none', background: '#f1f5f9',
              color: '#234F9A', borderRadius: 5,
              width: 34, height: 34, padding: 0
            }}
          >
            <i className="ti ti-refresh" />
          </button>

          <span style={{ fontSize: 10, color: '#607d8b' }}>
            Last Reload: {formatTime(lastReload)}
          </span>
        </div>

        <table style={{
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse'
        }}>
          <colgroup>
            {[3,8,7,7,7,7,6,6,6,5,5,5,6,7,6,8,7].map((w, i) =>
              <col key={i} style={{ width: `${w}%` }} />
            )}
          </colgroup>

          <thead>
            <tr>
              <th style={head}>No</th>
              {fields.map(([key, label]) => (
                <th key={key} style={head}>{label}</th>
              ))}
              <th style={head}>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="18" style={empty}>Loading...</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan="18" style={empty}>Data tidak ditemukan</td></tr>
            ) : filtered.map((x, i) => (
              <tr key={x.id ?? i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={cell}>{i + 1}</td>

                {fields.map(([key]) => (
                  <td
                    key={key}
                    style={{
                      ...cell,
                      textAlign: key === 'doc_no' ? 'left' : 'center'
                    }}
                  >
                    {key === 'last_synced_at'
                      ? formatTime(x[key])
                      : x[key] ?? '-'}
                  </td>
                ))}

                <td style={cell}>
                  <span style={{
                    padding: '4px 7px',
                    borderRadius: 12,
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    whiteSpace: 'nowrap'
                  }}>
                    Complete
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const head = {
  padding: '2px 1px',
  background: '#eaf0f7',
  color: '#263238',
  textAlign: 'center',
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1,
  position: 'sticky',
  top: 0,
  zIndex: 5
};

const empty = {
  textAlign: 'center',
  padding: 15,
  color: '#455A64'
};