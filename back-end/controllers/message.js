const sMessage = require('../models/message');

exports.getAllMessage = (req, res, next) => {
    //sort by date and get only message where receiver = null
    sMessage.find({ receiverId: null }).sort({ date: -1 })
        .then(messages => res.status(200).json(messages))
        .catch(error => res.status(400).json({ error }));
}