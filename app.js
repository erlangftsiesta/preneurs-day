//Import Modul
const express = require("express");
const http = require('http');
const socketConfig = require('./src/socketIO')
const bodyParser = require("body-parser");
const port = 1100;
const db = require("./connection");

//Inisialisasi koneksi Express Realtime dengan Socket IO
const app = express();
const server = http.createServer(app);

//Import Middleware
const responses = require("./middleware/responseJSON");
const preventMultipleRequests = require('./middleware/preventMultipleRequest');
const path = require("path");

//Panggil fungsi SocketIO
socketConfig(server);

//Inisialisasi Penanganan pengiriman data dengan JSON
app.use(bodyParser.json());

app.get('/', (req, res)=> {
    res.send('Home Routes Test')
});

app.get('/datas', (req, res)=> {
    db.query("SELECT * FROM perusahaan", (err, result) => {
        if (err) {
            // Jika terjadi error saat query
            console.error("Error executing query:", err);
            responses(500, err, "Error When Retrieving Datas", res);
        } else {
            console.log(result);
            // Mengirim hasil query sebagai respons
            responses(200, result, "Getting Datas Successfully", res);
        }
    });
});

app.post('/api/v1/post/voting', (req, res) => {
    const { stand_number } = req.body;

    if (!stand_number) {
        responses(400, err, "Stand Number Required!", res);
    }
    const query = "UPDATE perusahaan SET point = COALESCE(point, 0) + 1 WHERE stand_number = ?";

    db.query(query, [stand_number], (err, result) => {
        if (err) {
            console.error("Error executing query:", err);
            responses(500, err, "Error When Updating Company Point", res);
        }
        
        if (result.affectedRows === 0) {
            responses(404, err, "Company Not Found!", res);
        }

        responses(200, result, "Successfully Voted!", res);
    });
});

app.listen(port, ()=> {
    console.log("On: ", port);
});
