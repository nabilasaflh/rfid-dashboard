import { useEffect, useState } from 'react';

const API = 'http://localhost:5000';

const cell = {
  padding: '8px 6px',
  textAlign: 'center',
  fontSize: 11,
  color: '#263238',
  verticalAlign: 'middle',
  overflow: 'hidden',
  wordBreak: 'break-word'
};

const formatTime = value =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

export default function StokSticker() {
  const [data, setData] = useState([]);
  const [lastReload, setLastReload] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedRFID, setCopiedRFID] = useState(() =>
    JSON.parse(localStorage.getItem('copiedRFID') || '[]')
  );
  const [editMode, setEditMode] = useState(false);
  const [editedNumbers, setEditedNumbers] = useState({});

  const fetchStok = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/stok-sticker`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      setData(result.data ?? []);
      setUpdatedAt(result.updated_at);
      setLastReload(new Date());
    } catch (error) {
      console.error(error);
      alert('Gagal mengambil stok Sticker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStok();
  }, []);

  const copyRFID = async rfid => {
    try {
      await navigator.clipboard.writeText(rfid);

      const updated = [...new Set([...copiedRFID, rfid])];
      setCopiedRFID(updated);
      localStorage.setItem('copiedRFID', JSON.stringify(updated));
    } catch (error) {
      console.error(error);
      alert('RFID gagal dicopy');
    }
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
      const numbers = data.map(item =>
        Number(editedNumbers[item.id] ?? item.number_order)
      );

      if (
        numbers.some(n => !Number.isInteger(n) || n <= 0) ||
        new Set(numbers).size !== numbers.length
      ) {
        return alert('Nomor urut tidak boleh sama.');
      }

      for (let i = 0; i < data.length; i++) {
        if (numbers[i] === Number(data[i].number_order)) continue;

        const res = await fetch(
          `${API}/api/stok-sticker/${data[i].id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number_order: numbers[i]
            })
          }
        );

        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
      }

      setEditMode(false);
      setEditedNumbers({});
      await fetchStok();
      alert('Nomor urut berhasil diperbarui');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Gagal memperbarui nomor urut');
    }
  };

  return (
    <div>
      <div style={{
        fontSize: 14,
        color: '#455A64',
        marginBottom: 10
      }}>
        Daftar RFID Sticker yang tersedia
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15
      }}>
        <span style={{ fontSize: 11, color: '#78909c' }}>
          Last Reload: {formatTime(lastReload)}
        </span>

        <button
          onClick={fetchStok}
          disabled={loading}
          title="Reload"
          style={{
            width: 34,
            height: 34,
            border: '1px solid #dfe5eb',
            borderRadius: 5,
            background: '#fff',
            color: '#234F9A',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }}
        >
          <i className="ti ti-refresh" />
        </button>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e8edf2',
        borderRadius: 8,
        padding: 22,
        boxShadow: '0 3px 12px rgba(0,0,0,0.07)'
      }}>
        <div style={{
          padding: 20,
          border: '1px solid #e8edf2',
          borderRadius: 8,
          background: '#f8fafc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          marginBottom: 18
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 7,
              background: '#eaf0f7',
              color: '#234F9A',
              fontSize: 20
            }}>
              <i className="ti ti-sticker" />
            </div>

            <div>
              <div style={{
                fontSize: 12,
                color: '#78909c'
              }}>
                Stok Tersedia
              </div>

              <div style={{
                fontSize: 30,
                fontWeight: 600,
                color: '#263238'
              }}>
                {data.length}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 12,
            fontSize: 11,
            color: '#78909c'
          }}>
            RFID Sticker
          </div>
        </div>

        <div>
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
              Data RFID Sticker
            </div>

            {!editMode ? (
              <button
                onClick={startEdit}
                style={{
                  border: 'none',
                  background: '#234F9A',
                  color: '#fff',
                  borderRadius: 5,
                  padding: '7px 12px',
                  fontSize: 10,
                  cursor: 'pointer'
                }}
              >
                <i className="ti ti-edit" /> Edit Nomor Urut
              </button>
            ) : (
              <button
                onClick={saveNumbers}
                style={{
                  border: 'none',
                  background: '#234F9A',
                  color: '#fff',
                  borderRadius: 5,
                  padding: '7px 12px',
                  fontSize: 10,
                  cursor: 'pointer'
                }}
              >
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
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '38%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>

              <thead>
                <tr style={{ background: '#eaf0f7' }}>
                  {['Nomor Urut', 'RFID', 'Tanggal Masuk', 'Status']
                    .map(title => (
                      <th
                        key={title}
                        style={{
                          padding: 9,
                          fontSize: 11,
                          color: '#263238',
                          textAlign: 'center'
                        }}
                      >
                        {title}
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        padding: 20,
                        textAlign: 'center',
                        fontSize: 11,
                        color: '#78909c'
                      }}
                    >
                      Belum ada RFID Sticker
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => {
                    const isCopied = copiedRFID.includes(item.rfid);

                    return (
                      <tr
                        key={item.id ?? index}
                        style={{
                          borderBottom: '1px solid #eee'
                        }}
                      >
                        <td style={cell}>
                          {editMode ? (
                            <input
                              type="number"
                              value={
                                editedNumbers[item.id] ??
                                item.number_order ??
                                ''
                              }
                              onChange={e =>
                                setEditedNumbers({
                                  ...editedNumbers,
                                  [item.id]: e.target.value
                                })
                              }
                              style={{
                                width: '80px',
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

                        <td style={cell}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}>
                            <span style={{
                              textDecoration: isCopied
                                ? 'line-through'
                                : 'none'
                            }}>
                              {item.rfid ?? '-'}
                            </span>

                            {item.rfid && (
                              <button
                                onClick={() => copyRFID(item.rfid)}
                                title="Copy RFID"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#234F9A',
                                  padding: 0,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  lineHeight: 1
                                }}
                              >
                                <i className="ti ti-copy" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td style={cell}>
                          {formatTime(item.created_at)}
                        </td>

                        <td style={cell}>
                          Tersedia
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

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
            {formatTime(updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}