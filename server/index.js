require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json({limit: '1mb'}));

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'blood';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

let pool;
async function initPool() {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

initPool().catch(err => {
  console.error('Failed to create DB pool', err);
  process.exit(1);
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({status: 'ok'});
});

// --- Donors ---
app.get('/api/donors', async (req, res) => {
  try {
    // SELECT only columns expected to exist in the provided schema
    const [rows] = await pool.query('SELECT DonorID, FirstName, LastName, BloodType, PhoneNumber, City, LastDonationDate FROM Donors ORDER BY DonorID');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/donors', async (req, res) => {
  const { FirstName, LastName, BloodType, PhoneNumber, City } = req.body;
  if (!FirstName || !LastName || !BloodType || !PhoneNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Insert only the columns present in the schema supplied with the project
    const [result] = await pool.execute(
      `INSERT INTO Donors (FirstName, LastName, BloodType, PhoneNumber, City)
       VALUES (?, ?, ?, ?, ?)`,
      [FirstName, LastName, BloodType, PhoneNumber, City || null]
    );
    const insertedId = result.insertId;
    const [[row]] = await pool.query('SELECT DonorID, FirstName, LastName, BloodType, PhoneNumber, City, LastDonationDate FROM Donors WHERE DonorID = ?', [insertedId]);
    res.status(201).json(row);
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Donor with this phone number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// --- Hospitals ---
app.get('/api/hospitals', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT HospitalID, Name, Address FROM Hospitals ORDER BY HospitalID');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hospitals', async (req, res) => {
  const { Name, Address } = req.body;
  if (!Name || !Address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO Hospitals (Name, Address) VALUES (?, ?)`,
      [Name, Address]
    );
    const insertedId = result.insertId;
    const [[row]] = await pool.query('SELECT * FROM Hospitals WHERE HospitalID = ?', [insertedId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get hospital by id
app.get('/api/hospitals/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid hospital id' });
  try {
    const [[row]] = await pool.query('SELECT HospitalID, Name, Address FROM Hospitals WHERE HospitalID = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Hospital not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update hospital
app.put('/api/hospitals/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { Name, Address } = req.body;
  if (!id || !Name || !Address) return res.status(400).json({ error: 'Missing required fields' });
  try {
    await pool.execute('UPDATE Hospitals SET Name = ?, Address = ? WHERE HospitalID = ?', [Name, Address, id]);
    const [[row]] = await pool.query('SELECT HospitalID, Name, Address FROM Hospitals WHERE HospitalID = ?', [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hospitals/:id/requesthistory
// Fetches the request history for a specific hospital
app.get("/api/hospitals/:id/requesthistory", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Hospital ID is required" });
  }

  try {
    // 1. Call your stored procedure using the 'pool' variable
    const [results] = await pool.query(
      "CALL sp_GetHospitalRequestHistory(?)", 
      [id]
    );

    // 2. The stored procedure's result is in the first element (results[0])
    if (!results || !Array.isArray(results[0])) {
      throw new Error("Invalid response from stored procedure.");
    }

    // 3. Send the data (which is results[0]) as JSON.
    //    If no history was found, this correctly sends []
    res.json(results[0]);

  } catch (err) {
    // 4. Handle any database or server errors
    console.error(`Error fetching history for hospital ${id}:`, err);
    res.status(500).json({ error: "Failed to fetch hospital request history" });
  }
});

// --- BloodBanks ---
app.get('/api/bloodbanks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT BankID, Name, Address, ContactPerson FROM BloodBanks ORDER BY BankID');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bloodbanks/:id', async (req, res) => {
  const bankId = Number(req.params.id);
  if (!bankId) return res.status(400).json({ error: 'Invalid bank id' });
  try {
    const [[row]] = await pool.query('SELECT BankID, Name, Address, ContactPerson FROM BloodBanks WHERE BankID = ?', [bankId]);
    if (!row) return res.status(404).json({ error: 'Blood bank not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bloodbanks', async (req, res) => {
  const { Name, Address, ContactPerson } = req.body;
  if (!Name || !Address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO BloodBanks (Name, Address, ContactPerson) VALUES (?, ?, ?)`,
      [Name, Address, ContactPerson || null]
    );
    const insertedId = result.insertId;
    const [[row]] = await pool.query('SELECT * FROM BloodBanks WHERE BankID = ?', [insertedId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a blood bank
app.put('/api/bloodbanks/:id', async (req, res) => {
  const bankId = Number(req.params.id);
  const { Name, Address, ContactPerson } = req.body;
  if (!bankId || !Name || !Address) return res.status(400).json({ error: 'Missing required fields' });
  try {
    await pool.execute(
      `UPDATE BloodBanks SET Name = ?, Address = ?, ContactPerson = ? WHERE BankID = ?`,
      [Name, Address, ContactPerson || null, bankId]
    );
    const [[row]] = await pool.query('SELECT BankID, Name, Address, ContactPerson FROM BloodBanks WHERE BankID = ?', [bankId]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BloodInventory ---
app.get('/api/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT BagID, DonorID, BankID, BloodType, CollectionDate, ExpiryDate, Status FROM BloodInventory ORDER BY BagID');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  const { DonorID, BankID, BloodType, CollectionDate } = req.body;
  if (!DonorID || !BankID || !BloodType || !CollectionDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Check eligibility by calling your function
    const [[result]] = await pool.query(
      'SELECT CheckDonorEligibility(?) AS isEligible',
      [DonorID]
    );

    const isEligible = result.isEligible; // This will be 1 (true) or 0 (false)

    // 2. If not eligible, reject the request
    if (isEligible === 0) {
      return res.status(400).json({ error: 'Donor is not eligible to donate yet (must wait 56 days).' });
    }

    // 3. If eligible (isEligible === 1), proceed with the insert
    const [insertResult] = await pool.execute(
      `INSERT INTO BloodInventory (DonorID, BankID, BloodType, CollectionDate) VALUES (?, ?, ?, ?)`,
      [DonorID, BankID, BloodType, CollectionDate]
    );
    
    // 4. Send back the newly created item
    const insertedId = insertResult.insertId;
    const [[row]] = await pool.query('SELECT * FROM BloodInventory WHERE BagID = ?', [insertedId]);
    res.status(201).json(row);

  } catch (err) {
    // Catch any other database errors
    console.error("Error in POST /api/inventory:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- BloodRequests ---
app.get('/api/requests', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT RequestID, HospitalID, BankID, RequiredBloodType, UnitsNeeded, RequestDate, Status FROM BloodRequests ORDER BY RequestID');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  const { HospitalID, BankID, RequiredBloodType, UnitsNeeded } = req.body;
  if (!HospitalID || !BankID || !RequiredBloodType || !UnitsNeeded || UnitsNeeded <= 0) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO BloodRequests (HospitalID, BankID, RequiredBloodType, UnitsNeeded, RequestDate, Status)
       VALUES (?, ?, ?, ?, CURDATE(), 'Pending')`,
      [HospitalID, BankID, RequiredBloodType, UnitsNeeded]
    );
    res.status(201).json({ RequestID: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Actions ---
// Record a donation for a donor (calls sp_AddNewDonation)
app.post('/api/donors/:id/donate', async (req, res) => {
  const donorId = Number(req.params.id);
  const { bankId } = req.body;
  if (!donorId || !bankId) return res.status(400).json({ error: 'Missing donorId or bankId' });
  try {
    await pool.query('CALL sp_AddNewDonation(?, ?)', [donorId, bankId]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Fulfill a blood request (calls sp_FulfillBloodRequest)
app.post('/api/requests/:id/fulfill', async (req, res) => {
  const requestId = Number(req.params.id);
  if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
  try {
    await pool.query('CALL sp_FulfillBloodRequest(?)', [requestId]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// WARNING: This endpoint executes arbitrary SQL. Use only for local development.
app.post('/api/query', async (req, res) => {
  const { query, params } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing `query` string in body.' });
  }

  try {
    // Use execute for parameterized queries
    const [rows] = await pool.execute(query, params || []);
    res.json({ rows });
  } catch (err) {
    console.error('Query error:', err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
