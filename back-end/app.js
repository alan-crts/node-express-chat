require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
module.exports = function(app, server) {

    mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_URL}/${process.env.DB_NAME}?retryWrites=true&w=majority`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then(() => console.log('DB is OK'))
        .catch(() => console.log('DB failed'));

    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', '*');
        next();
    });

    app.use(express.json());

    const io = require('socket.io')(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken.userId;

            socket.userId = userId;
            socket.username = decodedToken.username;

            next();
        } else {
            next(new Error('Authentication error'));
        }
    });

    require('./socket/chat')(io);

    app.use(function(req, res, next) {
        req.io = io;
        next();
    });

    const authRoutes = require('./routes/auth');
    app.use('/auth', authRoutes);

    const userRoutes = require('./routes/user');
    app.use('/user', userRoutes);

    const messageRoutes = require('./routes/message');
    app.use('/message', messageRoutes);
}