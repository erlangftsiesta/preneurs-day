const mysql = require('mysql');

const db = mysql.createConnection({
    host:"localhost", 
    user:"root", 
    password:"", 
    database:"preneurs_testing"
});

module.exports = db;