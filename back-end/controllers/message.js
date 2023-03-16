const sMessage = require('../models/message');

exports.getAllMessage = (req, res, next) => {
    //sort by date and get only message where receiver = null
    sMessage.find({ receiverId: null }).sort({ date: -1 })
        .then(messages => res.status(200).json(messages))
        .catch(error => res.status(400).json({ error }));
}

exports.getAllMessageWithSenderAndReceiver = (req, res, next) => {
    //sort by date and get only message where receiver = req.params.id
    sMessage.find({ $or: [{ receiverId: req.userId, userId: req.params.id }, { receiverId: req.params.id, userId: req.userId }] }).sort({ date: -1 })
        .then(messages => {
            res.status(200).json(messages)
        })
        .catch(error => res.status(400).json({ error }));
}

exports.getAllMessageUnreadbyUser = (req, res, next) => {
    //get only message where receiver = connected user and readed = false and sort only userid with message count
    sMessage.aggregate([
            { $match: { receiverId: req.userId, read: false } },
            {
                $group: {
                    _id: "$userId",
                    username: { $first: "$username" },
                    count: { $sum: 1 }
                }
            }
        ])
        .then(messages => res.status(200).json(messages))
        .catch(error => res.status(400).json({ error }));
}

exports.setMessagesRead = (req, res, next) => {
    sMessage.updateMany({ userId: req.params.id, receiverId: req.userId }, { $set: { read: true } })
        .then(() => res.status(200).json({ message: 'Messages updated!' }))
        .catch(error => res.status(400).json({ error }));
}