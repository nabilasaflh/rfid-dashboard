require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function createTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS stok_sticker (
      id INT AUTO_INCREMENT PRIMARY KEY,
      number_order INT NOT NULL,
      rfid VARCHAR(255) NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS rfid_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loct_name VARCHAR(100),
      doc_no VARCHAR(150),
      ktgr VARCHAR(100),
      trnp VARCHAR(255),
      tgl VARCHAR(50),
      nopol VARCHAR(50),
      merk VARCHAR(100),
      jenis VARCHAR(100),
      warna VARCHAR(100),
      thn VARCHAR(20),
      ton VARCHAR(50),
      seq VARCHAR(20),
      jml_tag VARCHAR(20),
      loct VARCHAR(20),
      amount VARCHAR(50),
      rfid VARCHAR(100),
      printed_at DATETIME NULL,
      last_synced_at DATETIME NULL
    )
  `);

    const stickerColumns = [
    ['scanned_rfid', 'VARCHAR(255) NULL'],
    ['sticker_status', "VARCHAR(50) NOT NULL DEFAULT 'UNPROCESSED'"],
    ['copied_at', 'DATETIME NULL']
  ];

  for (const [column, definition] of stickerColumns) {
    const [columns] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'rfid_data'
        AND COLUMN_NAME = ?
    `, [column]);

    if (!columns.length) {
      await db.query(`
        ALTER TABLE rfid_data
        ADD COLUMN ${column} ${definition}
      `);
    }
  }

  const [columns] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'rfid_data'
      AND COLUMN_NAME = 'last_synced_at'
  `);

  if (!columns.length) {
    await db.query(`
      ALTER TABLE rfid_data
      ADD COLUMN last_synced_at DATETIME NULL
    `);
  }

  
  await db.query(`
    CREATE TABLE IF NOT EXISTS stok_xerafy (
      id INT PRIMARY KEY,
      jumlah_stok INT NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    INSERT IGNORE INTO stok_xerafy (id, jumlah_stok)
    VALUES (1, 0)
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS stok_xerafy_tag (
      id INT AUTO_INCREMENT PRIMARY KEY,
      number_order INT NOT NULL,
      rfid VARCHAR(255) NOT NULL UNIQUE,
      scanned_at DATETIME NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
      final_rfid VARCHAR(255) NULL,
      nopol VARCHAR(50) NULL,
      doc_no VARCHAR(150) NULL,
      tanggal_keluar DATETIME NULL
    )
  `);

  const xerafyColumns = [
    ['final_rfid', 'VARCHAR(255) NULL'],
    ['nopol', 'VARCHAR(50) NULL'],
    ['doc_no', 'VARCHAR(150) NULL'],
    ['tanggal_keluar', 'DATETIME NULL']
  ];

  for (const [column, definition] of xerafyColumns) {
    const [columns] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'stok_xerafy_tag'
        AND COLUMN_NAME = ?
    `, [column]);

    if (!columns.length) {
      await db.query(`
        ALTER TABLE stok_xerafy_tag
        ADD COLUMN ${column} ${definition}
      `);
    }
  }

  console.log('Tabel MySQL berhasil diperiksa/dibuat');
}

app.get('/', (req, res) => {
  res.json({
    message: 'Backend RFID Database berhasil berjalan'
  });
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Semua field wajib diisi'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password minimal 6 karakter'
      });
    }

    const [existing] = await db.query(
      `SELECT id FROM users WHERE username = ? OR email = ?`,
      [username, email]
    );

    if (existing.length) {
      return res.status(400).json({
        message: 'Username atau email sudah digunakan'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (username, email, password)
       VALUES (?, ?, ?)`,
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Registrasi berhasil'
    });
  } catch (error) {
    console.error('ERROR REGISTER:', error);
    res.status(500).json({
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Username/email dan password wajib diisi'
      });
    }

    const [users] = await db.query(
      `SELECT * FROM users
       WHERE username = ? OR email = ?`,
      [identifier, identifier]
    );

    if (!users.length) {
      return res.status(401).json({
        message: 'Username/email atau password salah'
      });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: 'Username/email atau password salah'
      });
    }

    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error);
    res.status(500).json({
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
});

app.post('/api/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({
        message: 'Semua field wajib diisi'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password baru minimal 6 karakter'
      });
    }

    const [users] = await db.query(
      `SELECT * FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    if (!users.length) {
      return res.status(404).json({
        message: 'User tidak ditemukan'
      });
    }

    const valid = await bcrypt.compare(
      oldPassword,
      users[0].password
    );

    if (!valid) {
      return res.status(401).json({
        message: 'Password lama salah'
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users
       SET password = ?
       WHERE username = ?`,
      [hashed, username]
    );

    res.json({
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('ERROR CHANGE PASSWORD:', error);
    res.status(500).json({
      message: 'Gagal mengubah password',
      error: error.message
    });
  }
});

app.post('/api/rfid/mark-printed', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({
        message: 'Tidak ada RFID yang dipilih'
      });
    }

    const placeholders = ids.map(() => '?').join(',');

    await db.query(`
      UPDATE rfid_data
      SET printed_at = NOW()
      WHERE id IN (${placeholders})
    `, ids);

    res.json({
      message: 'RFID berhasil ditandai sebagai printed'
    });
  } catch (error) {
    console.error('ERROR MARK PRINTED:', error);
    res.status(500).json({
      message: 'Gagal menandai RFID sebagai printed',
      error: error.message
    });
  }
});

async function syncRFIDData() {
  const apiUrl = process.env.RFID_API_URL;

  if (!apiUrl) {
    throw new Error('URL API RFID belum dikonfigurasi');
  }

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(
      `API RFID mengembalikan status ${response.status}`
    );
  }

  const apiData = await response.json();

  if (!Array.isArray(apiData)) {
    throw new Error('Format response API RFID bukan array');
  }

  let jumlahMasuk = 0;
  let jumlahUpdate = 0;

  for (const item of apiData) {
    const isXerafy = item.ktgr === 'Xerafy - Baru';

    const [existing] = await db.query(
      isXerafy
        ? `
          SELECT *
          FROM rfid_data
          WHERE doc_no = ?
            AND seq = ?
          ORDER BY id ASC
          LIMIT 1
        `
        : `
          SELECT *
          FROM rfid_data
          WHERE doc_no = ?
            AND seq = ?
            AND rfid = ?
          LIMIT 1
        `,
      isXerafy
        ? [item.doc_no, item.seq]
        : [item.doc_no, item.seq, item.rfid]
    );

    if (existing.length) {
      const old = existing[0];

      const changed =
        old.loct_name !== item.loct_name ||
        old.ktgr !== item.ktgr ||
        old.trnp !== item.trnp ||
        old.tgl !== item.tgl ||
        old.nopol !== item.nopol ||
        old.merk !== item.merk ||
        old.jenis !== item.jenis ||
        old.warna !== item.warna ||
        old.thn !== item.thn ||
        old.ton !== item.ton ||
        old.jml_tag !== item.jml_tag ||
        old.loct !== item.loct ||
        old.amount !== item.amount;

      if (changed) {
        await db.query(`
          UPDATE rfid_data
          SET
            loct_name = ?,
            ktgr = ?,
            trnp = ?,
            tgl = ?,
            nopol = ?,
            merk = ?,
            jenis = ?,
            warna = ?,
            thn = ?,
            ton = ?,
            jml_tag = ?,
            loct = ?,
            amount = ?,
            last_synced_at = NOW()
          WHERE id = ?
        `, [
          item.loct_name,
          item.ktgr,
          item.trnp,
          item.tgl,
          item.nopol,
          item.merk,
          item.jenis,
          item.warna,
          item.thn,
          item.ton,
          item.jml_tag,
          item.loct,
          item.amount,
          old.id
        ]);

        jumlahUpdate++;
      }

      continue;
    }

    await db.query(`
      INSERT INTO rfid_data (
        loct_name,
        doc_no,
        ktgr,
        trnp,
        tgl,
        nopol,
        merk,
        jenis,
        warna,
        thn,
        ton,
        seq,
        jml_tag,
        loct,
        amount,
        rfid,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      item.loct_name,
      item.doc_no,
      item.ktgr,
      item.trnp,
      item.tgl,
      item.nopol,
      item.merk,
      item.jenis,
      item.warna,
      item.thn,
      item.ton,
      item.seq,
      item.jml_tag,
      item.loct,
      item.amount,
      item.rfid
    ]);

    jumlahMasuk++;
  }

  return {
    jumlah_api: apiData.length,
    jumlah_masuk: jumlahMasuk,
    jumlah_update: jumlahUpdate
  };
}

app.get('/api/rfid', async (req, res) => {
  try {
    try {
      await syncRFIDData();
    } catch (error) {
      console.error(
        'AUTO SYNC RFID GAGAL:',
        error.message
      );
    }

    const [data] = await db.query(
      `SELECT * FROM rfid_data ORDER BY id DESC`
    );

    res.json(data);
  } catch (error) {
    console.error('ERROR GET RFID:', error);
    res.status(500).json({
      message: 'Gagal mengambil data RFID',
      error: error.message
    });
  }
});

app.post('/api/rfid', async (req, res) => {
  try {
    const {
      loct_name,
      doc_no,
      ktgr,
      trnp,
      tgl,
      nopol,
      merk,
      jenis,
      warna,
      thn,
      ton,
      seq,
      jml_tag,
      loct,
      amount,
      rfid
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO rfid_data (
        loct_name,
        doc_no,
        ktgr,
        trnp,
        tgl,
        nopol,
        merk,
        jenis,
        warna,
        thn,
        ton,
        seq,
        jml_tag,
        loct,
        amount,
        rfid,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      loct_name,
      doc_no,
      ktgr,
      trnp,
      tgl,
      nopol,
      merk,
      jenis,
      warna,
      thn,
      ton,
      seq,
      jml_tag,
      loct,
      amount,
      rfid
    ]);

    res.status(201).json({
      message: 'Data RFID berhasil ditambahkan',
      id: result.insertId
    });
  } catch (error) {
    console.error('ERROR POST RFID:', error);
    res.status(500).json({
      message: 'Gagal menambahkan data RFID',
      error: error.message
    });
  }
});

app.post('/api/rfid/sync', async (req, res) => {
  try {
    const result = await syncRFIDData();

    res.json({
      message: 'Data RFID berhasil disinkronkan',
      ...result
    });
  } catch (error) {
    console.error('ERROR SYNC RFID:', error);

    res.status(500).json({
      message: 'Gagal melakukan sinkronisasi RFID',
      error: error.message
    });
  }
});

app.get('/api/rfid-status', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM rfid_status
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('ERROR GET RFID STATUS:', error);

    res.status(500).json({
      message: 'Gagal mengambil status RFID',
      error: error.message
    });
  }
});

app.post('/api/rfid-status', async (req, res) => {
  try {
    const { doc_no, rfid, status } = req.body;

    if (!doc_no || !rfid || !status) {
      return res.status(400).json({
        message: 'doc_no, rfid, dan status wajib diisi'
      });
    }

    const [existing] = await db.query(`
      SELECT id
      FROM rfid_status
      WHERE doc_no = ?
        AND rfid = ?
      LIMIT 1
    `, [doc_no, rfid]);

    if (existing.length) {
      await db.query(`
        UPDATE rfid_status
        SET status = ?
        WHERE id = ?
      `, [status, existing[0].id]);
    } else {
      await db.query(`
        INSERT INTO rfid_status (doc_no, rfid, status)
        VALUES (?, ?, ?)
      `, [doc_no, rfid, status]);
    }

    res.json({
      message: 'Status RFID berhasil diperbarui'
    });
  } catch (error) {
    console.error('ERROR RFID STATUS:', error);

    res.status(500).json({
      message: 'Gagal memperbarui status RFID',
      error: error.message
    });
  }
});

app.post('/api/rfid/pair', async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { doc_no, rfid, xerafy_rfid } = req.body;
    const xerafyRFID = String(xerafy_rfid || rfid || '').trim();

    if (!doc_no || !xerafyRFID) {
      return res.status(400).json({
        message: 'doc_no dan RFID Xerafy wajib diisi'
      });
    }

    await connection.beginTransaction();

    const [tags] = await connection.query(
      `SELECT *
       FROM stok_xerafy_tag
       WHERE rfid = ?
       LIMIT 1
       FOR UPDATE`,
      [xerafyRFID]
    );

    if (!tags.length) {
      await connection.rollback();
      return res.status(404).json({
        message: 'RFID Xerafy tidak ditemukan di hasil scan'
      });
    }

    const tag = tags[0];

    if (tag.status === 'USED') {
      await connection.rollback();
      return res.status(409).json({
        message: 'Xerafy tersebut sudah digunakan'
      });
    }

    const [vehicles] = await connection.query(
      `SELECT *
       FROM rfid_data
       WHERE doc_no = ?
       ORDER BY CAST(NULLIF(seq, '') AS UNSIGNED) ASC, id ASC
       LIMIT 1
       FOR UPDATE`,
      [doc_no]
    );

    if (!vehicles.length) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Data kendaraan dengan doc_no tersebut tidak ditemukan'
      });
    }

    const vehicle = vehicles[0];

    if (!vehicle.nopol) {
      await connection.rollback();
      return res.status(400).json({
        message: 'No Pol kendaraan belum tersedia'
      });
    }

    // No Pol -> ASCII/HEX -> RFID final
    const finalRFID = Buffer
      .from(String(vehicle.nopol).trim(), 'utf8')
      .toString('hex')
      .toUpperCase();

    const [duplicate] = await connection.query(
      `SELECT id
       FROM rfid_data
       WHERE rfid = ?
       AND id <> ?
       LIMIT 1`,
      [finalRFID, vehicle.id]
    );

    if (duplicate.length) {
      await connection.rollback();
      return res.status(409).json({
        message: 'RFID hasil konversi No Pol sudah digunakan'
      });
    }

    // RFID pada Tag Request diganti menjadi RFID final
    await connection.query(
      `UPDATE rfid_data
       SET rfid = ?
       WHERE id = ?`,
      [finalRFID, vehicle.id]
    );

    // Simpan status pairing
    await connection.query(
      `INSERT INTO rfid_status
        (doc_no, rfid, status)
       VALUES (?, ?, 'PAIRED')
       ON DUPLICATE KEY UPDATE
        rfid = VALUES(rfid),
        status = 'PAIRED'`,
      [doc_no, finalRFID]
    );

    // Xerafy menjadi USED + tanggal keluar
    await connection.query(
      `UPDATE stok_xerafy_tag
       SET status = 'USED',
           final_rfid = ?,
           nopol = ?,
           doc_no = ?,
           tanggal_keluar = NOW()
       WHERE id = ?`,
      [
        finalRFID,
        vehicle.nopol,
        doc_no,
        tag.id
      ]
    );

    // Stok berkurang
    await connection.query(
      `UPDATE stok_xerafy
       SET jumlah_stok = GREATEST(jumlah_stok - 1, 0)
       WHERE id = 1`
    );

    await connection.commit();

    res.json({
      message: 'Xerafy berhasil dipasangkan',
      data: {
        doc_no,
        xerafy_rfid: xerafyRFID,
        nopol: vehicle.nopol,
        rfid: finalRFID,
        final_rfid: finalRFID,
        tanggal_keluar: new Date(),
        status: 'USED'
      }
    });

  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    console.error('ERROR PAIR RFID:', error);

    res.status(500).json({
      message: 'Gagal melakukan pairing RFID',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

app.get('/api/rfid-with-status', async (req, res) => {
  try {
    await syncRFIDData();

    const [rows] = await db.query(`
      SELECT
        r.*,
        COALESCE(
          s.status,
          'UNPAIRED'
        ) AS process_status
      FROM rfid_data r
      LEFT JOIN rfid_status s
        ON r.doc_no = s.doc_no
        AND r.rfid = s.rfid
      ORDER BY r.id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(
      'ERROR RFID WITH STATUS:',
      error
    );

    res.status(500).json({
      message:
        'Gagal mengambil data RFID dengan status',
      error: error.message
    });
  }
});

app.get('/api/xerafy-request', async (req, res) => {
  try {
    await syncRFIDData();

    const [rows] = await db.query(`
      SELECT
        r.*,
        COALESCE(s.status, 'UNPAIRED') AS process_status,

        (
          SELECT t.number_order
          FROM stok_xerafy_tag t
          WHERE t.doc_no = r.doc_no
            AND t.status = 'USED'
          ORDER BY t.number_order ASC
          LIMIT 1
        ) AS number_order

      FROM rfid_data r

      LEFT JOIN rfid_status s
        ON r.doc_no = s.doc_no
        AND r.rfid = s.rfid

      WHERE r.ktgr = 'Xerafy - Baru'
      ORDER BY r.id ASC
    `);

    res.json(rows);

  } catch (error) {
    console.error('ERROR XERAFY REQUEST:', error);

    res.status(500).json({
      message: 'Gagal mengambil data Xerafy Request',
      error: error.message
    });
  }
});

app.get('/api/sticker-request', async (req, res) => {
  try {
    await syncRFIDData();

    const [rows] = await db.query(`
      SELECT *
      FROM rfid_data
      WHERE UPPER(ktgr) = 'RFID STICKER'
      ORDER BY id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Gagal mengambil data RFID Sticker',
      error: error.message
    });
  }
});

// ==============================
// STICKER - SCAN RFID
// ==============================

app.post('/api/sticker/scan', async (req, res) => {
  try {
    const { id, rfid } = req.body;

    if (!id || !rfid) {
      return res.status(400).json({
        message: 'ID dan RFID wajib diisi'
      });
    }

    const [rows] = await db.query(
      `
      SELECT *
      FROM rfid_data
      WHERE id = ?
        AND UPPER(ktgr) = 'RFID STICKER'
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Data RFID Sticker tidak ditemukan'
      });
    }

    const [duplicate] = await db.query(
      `
      SELECT id
      FROM rfid_data
      WHERE rfid = ?
        AND id <> ?
      LIMIT 1
      `,
      [rfid, id]
    );

    if (duplicate.length) {
      return res.status(409).json({
        message: 'RFID sudah digunakan pada kendaraan lain'
      });
    }

    await db.query(
      `
      UPDATE rfid_data
      SET scanned_rfid = ?,
          sticker_status = 'SCANNED'
      WHERE id = ?
      `,
      [rfid, id]
    );

    res.json({
      message: 'RFID berhasil discan',
      data: {
        id,
        scanned_rfid: rfid,
        status: 'SCANNED'
      }
    });

  } catch (error) {
    console.error('ERROR STICKER SCAN:', error);

    res.status(500).json({
      message: 'Gagal melakukan scan RFID',
      error: error.message
    });
  }
});


// ==============================
// STICKER - SUBMIT RFID
// ==============================

app.post('/api/sticker/submit', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        message: 'ID wajib diisi'
      });
    }

    const [rows] = await db.query(
      `
      SELECT *
      FROM rfid_data
      WHERE id = ?
        AND UPPER(ktgr) = 'RFID STICKER'
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Data RFID Sticker tidak ditemukan'
      });
    }

    const data = rows[0];

    if (!data.scanned_rfid) {
      return res.status(400).json({
        message: 'RFID belum discan'
      });
    }

    const [duplicate] = await db.query(
      `
      SELECT id
      FROM rfid_data
      WHERE rfid = ?
        AND id <> ?
      LIMIT 1
      `,
      [data.scanned_rfid, id]
    );

    if (duplicate.length) {
      return res.status(409).json({
        message: 'RFID sudah digunakan pada kendaraan lain'
      });
    }

    await db.query(
      `
      UPDATE rfid_data
      SET rfid = scanned_rfid,
          sticker_status = 'PROCESSED'
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      message: 'RFID berhasil didaftarkan',
      data: {
        id,
        rfid: data.scanned_rfid,
        status: 'PROCESSED'
      }
    });

  } catch (error) {
    console.error('ERROR STICKER SUBMIT:', error);

    res.status(500).json({
      message: 'Gagal submit RFID',
      error: error.message
    });
  }
});

app.post('/api/sticker/copy', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        message: 'ID wajib diisi'
      });
    }

    const [rows] = await db.query(
      `
      SELECT *
      FROM rfid_data
      WHERE id = ?
        AND UPPER(ktgr) = 'RFID STICKER'
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Data RFID Sticker tidak ditemukan'
      });
    }

    if (!rows[0].rfid) {
      return res.status(400).json({
        message: 'RFID belum diproses'
      });
    }

    await db.query(
      `
      UPDATE rfid_data
      SET copied_at = NOW(),
          sticker_status = 'COMPLETE'
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      message: 'RFID berhasil dicopy',
      data: {
        id,
        status: 'COMPLETE'
      }
    });

  } catch (error) {
    console.error('ERROR STICKER COPY:', error);

    res.status(500).json({
      message: 'Gagal memperbarui status RFID',
      error: error.message
    });
  }
});

app.get('/api/stok-xerafy', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM stok_xerafy
      WHERE id = 1
    `);

    res.json(
      rows[0] || {
        id: 1,
        jumlah_stok: 0
      }
    );
  } catch (error) {
    console.error(
      'ERROR GET STOK XERAFY:',
      error
    );

    res.status(500).json({
      message: 'Gagal mengambil stok Xerafy',
      error: error.message
    });
  }
});

app.put('/api/stok-xerafy', async (req, res) => {
  try {
    const jumlah = Number(
      req.body.jumlah_stok
    );

    if (
      !Number.isInteger(jumlah) ||
      jumlah < 0
    ) {
      return res.status(400).json({
        message: 'Jumlah stok tidak valid'
      });
    }

    await db.query(`
      UPDATE stok_xerafy
      SET jumlah_stok = ?
      WHERE id = 1
    `, [jumlah]);

    res.json({
      message: 'Stok Xerafy berhasil diperbarui'
    });
  } catch (error) {
    console.error(
      'ERROR UPDATE STOK XERAFY:',
      error
    );

    res.status(500).json({
      message: 'Gagal memperbarui stok Xerafy',
      error: error.message
    });
  }
});

app.get('/api/stok-sticker', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        number_order,
        rfid,
        created_at
      FROM stok_sticker
      ORDER BY number_order ASC
    `);

    res.json({
      data: rows,
      updated_at:
        rows.at(-1)?.created_at || null
    });
  } catch (error) {
    console.error(
      'ERROR GET STOK STICKER:',
      error
    );

    res.status(500).json({
      message:
        'Gagal mengambil stok RFID Sticker',
      error: error.message
    });
  }
});

app.post('/api/stok-sticker', async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || !data.length) {
      return res.status(400).json({
        message: 'Tidak ada data Sticker'
      });
    }

    const numbers = data.map(
      x => Number(x.number_order)
    );

    if (
      numbers.some(
        x => !Number.isInteger(x) || x <= 0
      ) ||
      new Set(numbers).size !== numbers.length
    ) {
      return res.status(400).json({
        message:
          'Nomor urut tidak valid atau ada yang sama'
      });
    }

    const marks = numbers.map(() => '?').join(',');

    const [used] = await db.query(`
      SELECT number_order
      FROM stok_sticker
      WHERE number_order IN (${marks})
    `, numbers);

    if (used.length) {
      return res.status(400).json({
        message:
          `Nomor urut ${used[0].number_order} sudah digunakan`
      });
    }

    for (const item of data) {
      await db.query(`
        INSERT INTO stok_sticker (
          number_order,
          rfid
        )
        VALUES (?, ?)
      `, [
        Number(item.number_order),
        item.rfid
      ]);
    }

    res.json({
      message:
        `${data.length} RFID Sticker berhasil ditambahkan`
    });
  } catch (error) {
    console.error(
      'ERROR SAVE STOK STICKER:',
      error
    );

    res.status(500).json({
      message: 'Gagal menyimpan Stok Sticker',
      error: error.message
    });
  }
});

app.put('/api/stok-sticker/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const number = Number(
      req.body.number_order
    );

    if (
      !Number.isInteger(number) ||
      number <= 0
    ) {
      return res.status(400).json({
        message:
          'Nomor urut harus berupa angka positif'
      });
    }

    const [check] = await db.query(`
      SELECT id
      FROM stok_sticker
      WHERE number_order = ?
        AND id <> ?
    `, [number, id]);

    if (check.length) {
      return res.status(400).json({
        message:
          `Nomor urut ${number} sudah digunakan`
      });
    }

    const [result] = await db.query(`
      UPDATE stok_sticker
      SET number_order = ?
      WHERE id = ?
    `, [number, id]);

    if (!result.affectedRows) {
      return res.status(404).json({
        message:
          'Data Sticker tidak ditemukan'
      });
    }

    res.json({
      message:
        'Nomor urut berhasil diperbarui'
    });
  } catch (error) {
    console.error(
      'ERROR UPDATE NOMOR STICKER:',
      error
    );

    res.status(500).json({
      message:
        'Gagal memperbarui nomor urut'
    });
  }
});

app.get('/api/scan-xerafy', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        number_order,
        rfid,
        scanned_at,
        status,
        final_rfid,
        nopol,
        doc_no,
        tanggal_keluar
      FROM stok_xerafy_tag
      WHERE scanned_at IS NOT NULL
      ORDER BY number_order ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(
      'ERROR GET SCAN XERAFY:',
      error
    );

    res.status(500).json({
      message:
        'Gagal mengambil data scan Xerafy',
      error: error.message
    });
  }
});

app.post('/api/scan-xerafy', async (req, res) => {
  try {
    const rfid = String(
      req.body.rfid || ''
    ).trim();

    if (!rfid) {
      return res.status(400).json({
        message: 'RFID wajib diisi'
      });
    }

    const [existing] = await db.query(`
      SELECT id
      FROM stok_xerafy_tag
      WHERE rfid = ?
    `, [rfid]);

    if (existing.length) {
      return res.status(409).json({
        message:
          'RFID sudah pernah discan'
      });
    }

    const [last] = await db.query(`
      SELECT number_order
      FROM stok_xerafy_tag
      ORDER BY number_order DESC
      LIMIT 1
    `);

    const numberOrder =
      last.length > 0
        ? Number(last[0].number_order) + 1
        : 1;

    await db.query(`
      INSERT INTO stok_xerafy_tag (
        number_order,
        rfid,
        scanned_at,
        status
      )
      VALUES (?, ?, NOW(), 'AVAILABLE')
    `, [numberOrder, rfid]);

    await db.query(`
      UPDATE stok_xerafy
      SET jumlah_stok = jumlah_stok + 1
      WHERE id = 1
    `);

    res.json({
      message: 'Xerafy berhasil discan',
      number_order: numberOrder,
      rfid
    });
  } catch (error) {
    console.error(
      'ERROR SCAN XERAFY:',
      error
    );

    res.status(500).json({
      message:
        'Gagal menyimpan hasil scan Xerafy',
      error: error.message
    });
  }
});

app.delete('/api/scan-xerafy/:id', async (req, res) => {
  const connection = await db.getConnection();

  try {
    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message: 'ID scan tidak valid'
      });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(`
      SELECT
        id,
        status
      FROM stok_xerafy_tag
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
    `, [id]);

    if (!rows.length) {
      await connection.rollback();

      return res.status(404).json({
        message:
          'Data scan Xerafy tidak ditemukan'
      });
    }

    if (rows[0].status !== 'AVAILABLE') {
      await connection.rollback();

      return res.status(409).json({
        message:
          'Xerafy yang sudah digunakan tidak dapat dihapus'
      });
    }

    await connection.query(`
      DELETE FROM stok_xerafy_tag
      WHERE id = ?
    `, [id]);

    await connection.query(`
      UPDATE stok_xerafy
      SET jumlah_stok =
        GREATEST(jumlah_stok - 1, 0)
      WHERE id = 1
    `);

    await connection.commit();

    res.json({
      message:
        'Scan Xerafy berhasil dihapus'
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    console.error(
      'ERROR DELETE SCAN XERAFY:',
      error
    );

    res.status(500).json({
      message:
        'Gagal menghapus scan Xerafy',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

app.get('/api/xerafy-config', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT start_number
      FROM xerafy_config
      WHERE id = 1
    `);

    res.json({
      start_number:
        rows[0]?.start_number || 1
    });
  } catch (error) {
    res.status(500).json({
      message:
        'Gagal mengambil konfigurasi Xerafy'
    });
  }
});

app.put('/api/xerafy-config', async (req, res) => {
  try {
    const number = Number(
      req.body.start_number
    );

    if (
      !Number.isInteger(number) ||
      number <= 0
    ) {
      return res.status(400).json({
        message:
          'Nomor harus berupa angka positif'
      });
    }

    const [used] = await db.query(`
      SELECT id
      FROM stok_xerafy_tag
      WHERE number_order = ?
    `, [number]);

    if (used.length) {
      return res.status(400).json({
        message:
          `Nomor urut ${number} sudah digunakan`
      });
    }

    await db.query(`
      UPDATE xerafy_config
      SET start_number = ?
      WHERE id = 1
    `, [number]);

    res.json({
      message:
        'Nomor awal berhasil diperbarui'
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        'Gagal memperbarui nomor awal'
    });
  }
});

app.put('/api/stok-xerafy/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const number = Number(
      req.body.number_order
    );

    if (
      !Number.isInteger(number) ||
      number <= 0
    ) {
      return res.status(400).json({
        message:
          'Nomor urut harus berupa angka positif'
      });
    }

    const [check] = await db.query(`
      SELECT id
      FROM stok_xerafy_tag
      WHERE number_order = ?
        AND id != ?
    `, [number, id]);

    if (check.length) {
      return res.status(400).json({
        message:
          `Nomor urut ${number} sudah digunakan`
      });
    }

    await db.query(`
      UPDATE stok_xerafy_tag
      SET number_order = ?
      WHERE id = ?
    `, [number, id]);

    res.json({
      message:
        'Nomor urut berhasil diperbarui'
    });
  } catch (error) {
    console.error(
      'ERROR UPDATE STOK XERAFY:',
      error
    );

    res.status(500).json({
      message:
        'Gagal memperbarui nomor urut'
    });
  }
});

async function startServer() {
  try {
    await createTables();
    await db.query('SELECT 1');

    console.log('Koneksi MySQL berhasil');

    app.listen(PORT, () => {
      console.log(
        `Backend berjalan di http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'Gagal menjalankan backend:'
    );
    console.error(error);
  }
}

startServer();