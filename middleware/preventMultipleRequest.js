const votedIPs = new Set();

const preventMultipleVotes = (req, res, next) => {
    const ip = req.ip;

    if (votedIPs.has(ip)) {
        return res.status(403).send("You have already voted.");
    }

    votedIPs.add(ip);
    next();
};

module.exports = preventMultipleVotes;
