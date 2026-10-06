import { useEffect, useState } from 'react';

const API = 'http://localhost:5000';

const time = v =>
  v ? new Date(v).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '-';

const box = {
  flex: 1, padding: 20, border: '1px solid #e8edf2',
  borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.05)'
};

const inputStyle = {
  flex: 1, height: 36, padding: '0 10px',
  border: '1px solid #dfe5eb', borderRadius: 5
};

export default function StokXerafy() {
  const [stok, setStok] = useState(0);
  const [input, setInput] = useState('');
  const [start, setStart] = useState('');
  const [data, setData] = useState([]);
  const [editedNumbers, setEditedNumbers] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [updated, setUpdated] = useState(null);
  const [reload, setReload] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [s, c, d] = await Promise.all([
        fetch(`${API}/api/stok-xerafy`),
        fetch(`${API}/api/xerafy-config`),
        fetch(`${API}/api/scan-xerafy`)
      ]);

      const stock = await s.json();
      const config = await c.json();

      setStok(stock.jumlah_stok ?? 0);
      setUpdated(stock.updated_at);
      setStart(config.start_number ?? '');
      setData(await d.json());
      setReload(new Date());
    } catch {
      alert('Gagal mengambil data Xerafy');
    } finally {
      setLoading(false);
    }
  };

  const updateStok = async () => {
    if (input === '' || Number(input) < 0)
      return alert('Jumlah stok tidak valid');

    await fetch(`${API}/api/stok-xerafy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jumlah_stok: Number(input) })
    });

    setInput('');
    fetchData();
  };

  const saveStart = async () => {
    if (!start || Number(start) <= 0)
      return alert('Nomor awal tidak valid');

    const res = await fetch(`${API}/api/xerafy-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_number: Number(start) })
    });

    const result = await res.json();
    if (!res.ok) return alert(result.message);

    fetchData();
  };

  const startEdit = () => {
    const numbers = {};

    data.forEach(item => {
      numbers[item.id] = item.number_order;
    });

    setEditedNumbers(numbers);
    setEditMode(true);
  };

  const saveNumbers = async () => {
    try {
      for (const item of data) {
        const number = editedNumbers[item.id];

        if (
          number === undefined ||
          number === '' ||
          Number.isNaN(Number(number))
        ) continue;

        const res = await fetch(
          `${API}/api/stok-xerafy/${item.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number_order: Number(number)
            })
          }
        );

        const result = await res.json();

        if (!res.ok) {
          alert(result.message);
          return;
        }
      }

      setEditMode(false);
      await fetchData();
      alert('Nomor urut berhasil diperbarui');
    } catch {
      alert('Gagal memperbarui nomor urut');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div style={{ fontSize: 14, color: '#455A64', marginBottom: 10 }}>
        Kelola jumlah stok dan nomor urut Xerafy yang tersedia
      </div>

      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        alignItems: 'center', gap: 10, marginBottom: 15
      }}>
        <span style={{ fontSize: 11, color: '#78909c' }}>
          Last Reload: {time(reload)}
        </span>

        <button
          onClick={fetchData}
          disabled={loading}
          title="Reload"
          style={{
            width: 34, height: 34, border: '1px solid #dfe5eb',
            borderRadius: 5, background: '#fff', color: '#234F9A'
          }}
        >
          <i className="ti ti-refresh" />
        </button>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e8edf2',
        borderRadius: 8, padding: 22,
        boxShadow: '0 3px 12px rgba(0,0,0,.07)'
      }}>
        {/* 3 CARD */}
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ ...box, background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 7, background: '#eaf0f7',
                color: '#234F9A', fontSize: 20
              }}>
                <i className="ti ti-tag" />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#78909c' }}>
                  Stok Tersedia
                </div>

                <div style={{
                  fontSize: 30, fontWeight: 600, color: '#263238'
                }}>
                  {stok}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 11, color: '#78909c', marginTop: 12
            }}>
              Unit Xerafy
            </div>
          </div>

          <div style={box}>
            <b>Update Stok</b>

            <div style={{
              fontSize: 11, color: '#78909c', margin: '6px 0 15px'
            }}>
              Masukkan jumlah stok fisik Xerafy
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Jumlah stok"
                style={inputStyle}
              />

              <button onClick={updateStok} style={btn}>
                Update
              </button>
            </div>
          </div>

          <div style={box}>
            <b>Nomor Urut</b>

            <div style={{
              fontSize: 11, color: '#78909c', margin: '6px 0 15px'
            }}>
              Tentukan nomor awal Xerafy
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                min="1"
                value={start}
                onChange={e => setStart(e.target.value)}
                placeholder="Nomor awal"
                style={inputStyle}
              />

              <button onClick={saveStart} style={btn}>
                Simpan
              </button>
            </div>
          </div>
        </div>

        {/* TABEL - mengikuti Stok Sticker */}
        <div style={{ marginTop: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#263238'
            }}>
              Data Xerafy
            </div>

            {!editMode ? (
              <button onClick={startEdit} style={editBtn}>
                <i className="ti ti-edit" /> Edit Nomor Urut
              </button>
            ) : (
              <button onClick={saveNumbers} style={editBtn}>
                <i className="ti ti-device-floppy" /> Simpan
              </button>
            )}
          </div>

          <div style={{
            border: '1px solid #e8edf2',
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'collapse'
            }}>
              {/* jumlah dan ukuran kolom */}
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '23%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>

              <thead>
                <tr style={{ background: '#eaf0f7' }}>
                  {[
                    'Nomor Urut',
                    'RFID Sementara',
                    'RFID Final',
                    'Tanggal Masuk',
                    'Tanggal Keluar',
                    'Status'
                  ].map(title => (
                    <th key={title} style={th}>
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={empty}>
                      Belum ada Xerafy
                    </td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid #eee' }}
                    >
                      <td style={td}>
                        {editMode ? (
                          <input
                            type="number"
                            value={
                              editedNumbers[item.id] ??
                              item.number_order ?? ''
                            }
                            onChange={e =>
                              setEditedNumbers({
                                ...editedNumbers,
                                [item.id]: e.target.value
                              })
                            }
                            style={{
                              width: 80,
                              height: 30,
                              border: '1px solid #dfe3e8',
                              borderRadius: 5,
                              textAlign: 'center',
                              fontSize: 11
                            }}
                          />
                        ) : (
                          item.number_order ?? '-'
                        )}
                      </td>

                      <td style={td}>
                        {item.rfid ?? '-'}
                      </td>

                      <td style={td}>
                        {item.final_rfid ?? '-'}
                      </td>

                      <td style={td}>
                        {time(item.scanned_at)}
                      </td>

                      <td style={td}>
                        {time(item.tanggal_keluar)}
                      </td>

                      <td style={td}>
                        {item.status === 'USED'
                          ? 'Terpakai'
                          : 'Tersedia'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tetap paling bawah */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid #eee',
          fontSize: 11,
          color: '#78909c'
        }}>
          <span>Terakhir diperbarui</span>

          <span style={{ color: '#263238' }}>
            {time(updated)}
          </span>
        </div>
      </div>
    </div>
  );
}

const btn = {
  height: 36,
  padding: '0 15px',
  border: 0,
  borderRadius: 5,
  background: '#234F9A',
  color: '#fff'
};

const editBtn = {
  border: 'none',
  background: '#234F9A',
  color: '#fff',
  borderRadius: 5,
  padding: '7px 12px',
  fontSize: 10,
  cursor: 'pointer'
};

const th = {
  padding: 9,
  fontSize: 11,
  color: '#263238',
  textAlign: 'center'
};

const td = {
  padding: '8px 6px',
  textAlign: 'center',
  fontSize: 11,
  color: '#263238',
  verticalAlign: 'middle'
};

const empty = {
  padding: 20,
  textAlign: 'center',
  fontSize: 11,
  color: '#78909c'
};