const sUser = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = (req, res, next) => {

    let hash = req.body.password ? bcrypt.hashSync(req.body.password, 10) : null;

    const user = new sUser({
        username: req.body.username,
        password: hash
    });
    user.save()
        .then(() => res.status(201).json({ message: 'User created' }))
        .catch(error => {
            if (error.code === 11000) {
                res.status(400).json({ error: 'Username already exists' });
            } else {
                res.status(400).json({ error });
            }
        });
}

exports.login = (req, res, next) => {
    sUser.findOne({ username: req.body.username })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error: 'Incorrect password' });
                    }
                    res.status(200).json({
                        userId: user._id,
                        username: user.username,
                        token: jwt.sign({ userId: user._id },
                            process.env.JWT_SECRET, { expiresIn: '48h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
}

exports.getAllUser = (req, res, next) => {
    sUser.find()
        .then(users => res.status(200).json(users))
        .catch(error => res.status(400).json({ error }));
}

exports.getOneUser = (req, res, next) => {
    sUser.findOne({ _id: req.params.id })
        .then(thing => res.status(200).json(thing))
        .catch(error => res.status(404).json({ error }));
}

exports.getSelf = (req, res, next) => {
    //return user without password
    sUser.findOne({ _id: req.userId })
        .then(user => res.status(200).json({ id: user._id, username: user.username }))
        .catch(error => res.status(404).json({ error }));
}