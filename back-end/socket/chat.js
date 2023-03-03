const sMessage = require('../models/message');

module.exports = function(io) {

    io.on('connection', (socket) => {
        console.log(`Connecté au client ${socket.id}`)
        io.emit('notification', { type: 'new_user', data: socket.id });

        // Listener sur la déconnexion
        socket.on('disconnect', () => {
            console.log(`user ${socket.id} disconnected`);
            io.emit('notification', { type: 'removed_user', data: socket.id });
        });

        socket.on('message', (msg) => {
            console.log(socket.username, msg);
            sMessage({
                message: msg.message,
                userId: socket.userId,
                username: socket.username,
                receiverId: null
            }).save();

            io.emit('message', { message: msg.message, username: socket.username, userId: socket.userId });
        });
    })
}