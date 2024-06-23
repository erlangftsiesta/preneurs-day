// Import Modul
const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const path = require("path");
const port = 1100;
const cors = require('cors');

// Import Middleware dan koneksi database
const responses = require("./middleware/responseJSON");
const db = require("./connection");
const checkUniqueId = require("./middleware/checkUniqueID");

// Inisialisasi koneksi Express Realtime dengan Socket IO
const app = express();

// Inisialisasi Penanganan pengiriman data dengan JSON
app.use(bodyParser.json());

// Konfigurasi sesi
app.use(session({
    secret: 'fckYouCORS',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 36000000 } // Sesi berlaku selama 1 menit
}));

const corsOption = {
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204
}
app.use(cors())

//------------------------------------------------------------
const { v4: uuidv4 } = require('uuid');

// Middleware to generate unique session key if not already present
const generateSessionKey = (req, res, next) => {
    if (!req.session.uniqueKey) {
        req.session.uniqueKey = uuidv4();
    }
    next();
};

app.use(generateSessionKey);
//------------------------------------------------------------


// Route untuk menampilkan halaman voting
app.get('/', async (req, res) => {
    const uniqueId = req.session.uniqueKey;
    try {
        const result = await db.query('SELECT * FROM votes WHERE uuid = ?', [uniqueId]);
        const hasVoted = result.length > 0;
        res.render('index', { uniqueKey: uniqueId, hasVoted });
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/api/v1/get/data', cors(corsOption), (req, res)=> {
    db.query("SELECT * FROM perusahaan", (err, result) => {
        if (err) {
            console.error("Error executing query:", err);
            return responses(500, err, "Error When Retrieving Datas", res); // Pastikan responses diimplementasikan dengan benar
        }
        console.log(result);
        // Mengirim hasil query sebagai respons
        return responses(200, result, "Getting Datas Successfully", res); // Pastikan responses diimplementasikan dengan benar
    });
});

// Route untuk mengirim suara
app.post('/api/v1/post/voting', checkUniqueId, (req, res) => {
    const { stand_number } = req.body;
    const uniqueId = req.session.uniqueKey;

    if (!stand_number) {
        responses(400, null, "Stand Number Required!", res);
        return;
    }

    // Check if the user has already voted in this session
    if (req.session.hasVoted) {
        responses(403, null, "You have already voted in this session.", res);
        return;
    }

    const updateQuery = "UPDATE perusahaan SET point = COALESCE(point, 0) + 1 WHERE stand_number = ?";
    const insertVoteQuery = "INSERT INTO votes (uuid, stand_number) VALUES (?, ?)";

    db.query(updateQuery, [stand_number], (err, result) => {
        if (err) {
            console.error("Error executing query:", err);
            responses(500, err, "Error When Updating Company Point", res);
            return;
        }

        if (result.affectedRows === 0) {
            responses(404, null, "Company Not Found!", res);
            return;
        }

        // Simpan voting di database
        db.query(insertVoteQuery, [uniqueId, stand_number], (err, result) => {
            if (err) {
                console.error("Error inserting vote:", err);
                responses(500, err, "Error When Saving Vote", res);
                return;
            }

            // Tandai bahwa pengguna sudah melakukan voting di sesi
            req.session.hasVoted = true;

            responses(200, result, "Successfully Voted!", res);
        });
    });
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log("On: ", port);
});
