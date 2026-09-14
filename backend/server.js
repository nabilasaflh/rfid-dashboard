require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


// ==============================
// MYSQL CONNECTION
// ==============================

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


// ==============================
// CREATE TABLES
// ==============================

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
      rfid VARCHAR(100)
    )
  `);

  console.log('Tabel MySQL berhasil diperiksa/dibuat');
}


// ==============================
// HOME BACKEND
// ==============================

app.get('/', (req, res) => {
  res.json({
    message: 'Backend RFID Database berhasil berjalan'
  });
});


// ==============================
// REGISTER
// ==============================

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Semua field wajib diisi'
      });
    }

    const [existingUser] = await db.query(
      `
      SELECT id
      FROM users
      WHERE username = ? OR email = ?
      `,
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: 'Username atau email sudah digunakan'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
      `,
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Registrasi berhasil'
    });

  } catch (error) {
    console.error('ERROR REGISTER:');
    console.error(error);

    res.status(500).json({
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
});


// ==============================
// LOGIN
// ==============================

app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Username/email dan password wajib diisi'
      });
    }

    const [users] = await db.query(
      `
      SELECT *
      FROM users
      WHERE username = ? OR email = ?
      `,
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Username/email atau password salah'
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
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
    console.error('ERROR LOGIN:');
    console.error(error);

    res.status(500).json({
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
});


// ==============================
// AUTO SYNC RFID FROM API
// ==============================

async function syncRFIDData() {
  const apiUrl = process.env.RFID_API_URL;

  if (!apiUrl) {
    throw new Error('URL API RFID belum dikonfigurasi');
  }

  console.log('Mengecek data terbaru dari API RFID...');

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

  for (const item of apiData) {

    const [existing] = await db.query(
      `
      SELECT id
      FROM rfid_data
      WHERE doc_no = ?
        AND seq = ?
        AND rfid = ?
      LIMIT 1
      `,
      [
        item.doc_no,
        item.seq,
        item.rfid
      ]
    );

    if (existing.length > 0) {
      continue;
    }

    await db.query(
      `
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
        rfid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
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
      ]
    );

    jumlahMasuk++;
  }

  console.log(
    `Auto sync selesai. Data API: ${apiData.length}, data baru: ${jumlahMasuk}`
  );

  return {
    jumlah_api: apiData.length,
    jumlah_masuk: jumlahMasuk
  };
}


// ==============================
// GET RFID DATA + AUTO SYNC
// ==============================

app.get('/api/rfid', async (req, res) => {

  console.log('REQUEST /api/rfid MASUK');

  try {

    // ==============================
    // 1. SYNC DATA TERBARU
    // ==============================

    let syncResult = null;

    try {
      syncResult = await syncRFIDData();
    } catch (syncError) {
      console.error('AUTO SYNC RFID GAGAL:');
      console.error(syncError.message);
    }


    // ==============================
    // 2. AMBIL DATA DARI MYSQL
    // ==============================

    const [data] = await db.query(`
      SELECT *
      FROM rfid_data
      ORDER BY id DESC
    `);

    console.log(
      `Data RFID dikirim ke frontend: ${data.length} baris`
    );


    // ==============================
    // 3. KIRIM DATA KE FRONTEND
    // ==============================

    res.json(data);

  } catch (error) {

    console.error('ERROR GET RFID:');
    console.error(error);

    res.status(500).json({
      message: 'Gagal mengambil data RFID',
      error: error.message
    });
  }
});


// ==============================
// POST RFID DATA
// ==============================

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

    const [result] = await db.query(
      `
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
        rfid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
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
      ]
    );

    res.status(201).json({
      message: 'Data RFID berhasil ditambahkan',
      id: result.insertId
    });

  } catch (error) {

    console.error('ERROR POST RFID:');
    console.error(error);

    res.status(500).json({
      message: 'Gagal menambahkan data RFID',
      error: error.message
    });
  }
});


// ==============================
// MANUAL SYNC RFID
// ==============================

app.post('/api/rfid/sync', async (req, res) => {

  try {

    const result = await syncRFIDData();

    res.json({
      message: 'Data RFID berhasil disinkronkan',
      jumlah_api: result.jumlah_api,
      jumlah_masuk: result.jumlah_masuk
    });

  } catch (error) {

    console.error('ERROR SYNC RFID:');
    console.error(error);

    res.status(500).json({
      message: 'Gagal melakukan sinkronisasi data RFID',
      error: error.message
    });
  }
});


// ==============================
// START SERVER
// ==============================

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

    console.error('Gagal menjalankan backend:');
    console.error(error);

  }
}

startServer();