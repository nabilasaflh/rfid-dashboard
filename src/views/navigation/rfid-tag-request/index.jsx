import { useEffect, useState } from 'react';

// ==============================|| RFID DASHBOARD ||============================== //

export default function DefaultPage() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==============================|| GET RFID DATA ||============================== //

  useEffect(() => {
    fetch('http://localhost:5000/api/rfid')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Gagal mengambil data RFID');
        }

        return response.json();
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  // ==============================|| TABLE COLUMNS ||============================== //

  const columns = [
    ['No', 'no'],
    ['Loct Name', 'loct_name'],
    ['Document No', 'doc_no'],
    ['Kategori', 'ktgr'],
    ['Transporter', 'trnp'],
    ['Tanggal', 'tgl'],
    ['No Polisi', 'nopol'],
    ['Merk', 'merk'],
    ['Jenis', 'jenis'],
    ['Warna', 'warna'],
    ['Tahun', 'thn'],
    ['Ton', 'ton'],
    ['Seq', 'seq'],
    ['Jml Tag', 'jml_tag'],
    ['Loct', 'loct'],
    ['Amount', 'amount'],
    ['RFID', 'rfid']
  ];

  // ==============================|| SEARCH ||============================== //

  const filteredData = data.filter((item) =>
    Object.values(item)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ==============================|| RFID DASHBOARD ||============================== //

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 120px)',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ================= HEADER ================= */}

      <div>
        <p
          style={{
            margin: '5px 0 0',
            marginBottom: '5px',
            color: '#6b7280',
            fontSize: '14px'
          }}
        >
          Monitoring data API RFID di lingkungan Indocement Citeureup
        </p>
      </div>

      {/* ================= TABLE CARD ================= */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0px 8px 20px rgba(0,0,0,0.12)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* ================= SEARCH ================= */}

        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div
            style={{
              width: '330px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #e5e7eb',
              borderRadius: '7px',
              padding: '0 12px',
              boxShadow: '0px 3px 10px rgba(0,0,0,0.08)'
            }}
          >
            <i
              className="ti ti-search"
              style={{
                fontSize: '18px',
                color: '#6b7280',
                marginRight: '10px'
              }}
            />

            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13px'
              }}
            />
          </div>
        </div>

        {/* ================= TABLE ================= */}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowX: 'auto',
            overflowY: 'auto'
          }}
        >
          <table
            style={{
              width: 'max-content',
              minWidth: '1600px',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              fontSize: '12px'
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#e8eef4',
                  height: '48px'
                }}
              >
                {columns.map(([label]) => (
                  <th
                    key={label}
                    style={{
                      width:
                        label === 'Transporter'
                          ? '220px'
                          : label === 'RFID'
                            ? '210px'
                            : label === 'Document No'
                              ? '190px'
                              : label === 'Loct Name'
                                ? '120px'
                                : '95px',
                      padding: '0 12px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      color: '#111827',
                      fontWeight: 700,
                      borderBottom: '1px solid #cbd5e1'
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ================= LOADING ================= */}

              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      textAlign: 'center',
                      padding: '30px',
                      color: '#6b7280'
                    }}
                  >
                    Loading data RFID...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                /* ================= NO DATA ================= */

                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      textAlign: 'center',
                      padding: '30px',
                      color: '#6b7280'
                    }}
                  >
                    Tidak ada data RFID
                  </td>
                </tr>
              ) : (
                /* ================= DATA ================= */

                filteredData.map((item, index) => (
                  <tr
                    key={item.id || index}
                    style={{
                      height: '65px',
                      borderBottom: '1px solid #d1d5db'
                    }}
                  >
                    {columns.map(([, key]) => (
                      <td
                        key={key}
                        style={{
                          padding: '8px 12px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#111827'
                        }}
                      >
                        {key === 'no' ? index + 1 : item[key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}