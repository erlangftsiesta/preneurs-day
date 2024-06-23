const db = require("../connection");
const responses = require("./responseJSON");

const checkUniqueId = async (req, res, next) => {
    const uniqueId = req.session.uniqueKey;
    try {
        const result = await db.query('SELECT * FROM votes WHERE uuid = ?', [uniqueId]);
        if (result.length > 0) {
            responses(403, null, 'Anda sudah memberikan suara.', res);
            return;
        }
        next();
    } catch (error) {
        console.error('Database query error:', error);
        responses(500, error, 'Internal Server Error', res);
    }
};

module.exports = checkUniqueId;
