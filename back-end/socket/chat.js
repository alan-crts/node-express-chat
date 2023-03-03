const sMessage = require('../models/message');
let listConnectedUsers = [];
module.exports = function(io) {

    io.on('connection', (socket) => {
        console.log(`Connecté à ${socket.username}`)
        listConnectedUsers.push(socket.username);
        io.emit('list_connected_users', [...new Set(listConnectedUsers)]);

        // Listener sur la déconnexion
        socket.on('disconnect', () => {
            console.log(`user ${socket.username} disconnected`);
            listConnectedUsers = listConnectedUsers.filter((user) => user !== socket.username);
            io.emit('list_connected_users', [...new Set(listConnectedUsers)]);
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