const sMessage = require('../models/message');
let listConnectedUsers = [];
module.exports = function(io) {

    io.on('connection', (socket) => {
        console.log(`Connecté à ${socket.username}`)
        listConnectedUsers.push({ socketId: socket.id, username: socket.username, userId: socket.userId });

        io.emit('list_connected_users', listConnectedUsers.filter((user, index, self) =>
            index === self.findIndex((t) => (
                t.userId === user.userId
            ))
        ).map((user) => {
            return { username: user.username, userId: user.userId }
        }));

        socket.on('disconnect', () => {
            console.log(`user ${socket.username} disconnected`);
            listConnectedUsers = listConnectedUsers.filter((user) => user.socketId !== socket.id);

            io.emit('list_connected_users', listConnectedUsers.filter((user, index, self) =>
                index === self.findIndex((t) => (
                    t.userId === user.userId
                ))
            ).map((user) => {
                return { username: user.username, userId: user.userId }
            }));
        });

        socket.on('message', (msg) => {
            if (msg.message.length > 0 && msg.message.trim().length > 0) {
                sMessage({
                    message: msg.message,
                    userId: socket.userId,
                    username: socket.username,
                    receiverId: null
                }).save();

                io.emit('message', { message: msg.message, username: socket.username, userId: socket.userId });
            }
        });
    })
}