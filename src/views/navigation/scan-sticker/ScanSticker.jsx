import { useState } from 'react';
import Card from 'react-bootstrap/Card';

const API = 'http://localhost:5000';

const cell = {
  padding: '7px 5px',
  color: '#263238',
  fontSize: 10,
  textAlign: 'center',
  borderBottom: '1px solid #eee'
};

const input = {
  height: 36,
  padding: '0 10px',
  border: '1px solid #dfe3e8',
  borderRadius: 7,
  fontSize: 11
};

const button = {
  border: 'none',
  background: '#234F9A',
  color: '#fff',
  borderRadius: 5,
  padding: '7px 12px',
  fontSize: 10,
  cursor: 'pointer'
};

export default function ScanSticker() {
  const [file, setFile] = useState(null);
  const [startNumber, setStartNumber] = useState('');
  const [data, setData] = useState([]);

  const readFile = () => {
    if (!file || !startNumber) {
      alert('File TXT dan nomor urut awal wajib diisi.');
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      const rfids = e.target.result
        .split(/\r?\n/)
        .map(x => x.trim())
        .filter(Boolean);

      setData(
        rfids.map((rfid, i) => ({
          number_order: Number(startNumber) + i,
          rfid
        }))
      );
    };

    reader.readAsText(file);
  };

  const saveData = async () => {
    try {
      const res = await fetch(`${API}/api/stok-sticker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      alert('Data Sticker berhasil masuk ke stok.');
      setData([]);
      setFile(null);
      setStartNumber('');
    } catch (error) {
      alert(error.message || 'Gagal menyimpan data.');
    }
  };

  return (
    <div>
      <div style={{ fontSize: 14, color: '#455A64', marginBottom: 10 }}>
        Import hasil scan RFID Sticker
      </div>

      <Card style={{ border: '1px solid #e1e5eb', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          gap: 10,
          padding: '14px 20px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="file"
            accept=".txt"
            onChange={e => setFile(e.target.files[0])}
            style={{
              ...input,
              display: 'flex',
              alignItems: 'center',
              paddingTop: 6,
              paddingBottom: 0
            }}
          />

          <input
            type="number"
            placeholder="Nomor Urut Awal"
            value={startNumber}
            onChange={e => setStartNumber(e.target.value)}
            style={{ ...input, width: 150 }}
          />

          <button onClick={readFile} style={button}>
            <i className="ti ti-upload" /> Baca File
          </button>
        </div>

        <div style={{ padding: '0 20px 15px', fontSize: 10, color: '#78909c' }}>
          Masukkan nomor urut pertama. Nomor berikutnya akan dibuat otomatis berdasarkan urutan RFID dalam file.
        </div>

        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eaf0f7' }}>
              {['No', 'Nomor Urut', 'RFID', 'Status'].map(x => (
                <th key={x} style={{ padding: 8, color: '#263238', fontSize: 10 }}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!data.length ? (
              <tr>
                <td colSpan="4" style={{ ...cell, padding: 25 }}>
                  Belum ada data RFID
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr key={i}>
                  <td style={cell}>{i + 1}</td>
                  <td style={cell}>{item.number_order}</td>
                  <td style={cell}>{item.rfid}</td>
                  <td style={cell}>Siap digunakan</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {data.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 15 }}>
            <button onClick={saveData} style={button}>
              <i className="ti ti-package" /> Simpan ke Stok Sticker
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}