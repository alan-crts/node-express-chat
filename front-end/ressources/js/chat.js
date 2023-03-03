let userInfo = {};

(function() {
    const server = 'http://127.0.0.1:3000'
    const socket = io(server, { auth: { token: localStorage.getItem('token') } });

    socket.on('notification', (data) => {
        console.log('Message depuis le seveur:', data);
    })
    fetch(`${server}/user/self`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    }).then((res) => {
        if (res.status === 401) {
            document.location.href = '/front-end/auth/login.html';
        }
        return res.json()
    }).then((data) => {
        if (data.id) {
            userInfo = data;

            fetch(`${server}/message`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }).then((resMessages) => {
                return resMessages.json()
            }).then(async(dataMessages) => {
                document.getElementById('title').innerHTML += ` - ${data.username}`;

                await dataMessages.forEach((message) => {
                    addMessage(message.message, message.username, message.userId, message.timestamp);
                })

                document.getElementsByClassName('chat-list')[0].scrollTop = document.getElementsByClassName('chat-list')[0].scrollHeight;

                let element = document.getElementsByClassName("page-loader")[0];

                element.classList.add("fade-out");
                setTimeout(() => {
                    element.remove();
                }, 1000);
            })
        }
    })



    function sendMessage() {
        let message = document.getElementById('message-input').value;
        if (message) {
            socket.emit('message', { message });
            document.getElementById('message-input').value = '';
        }
    }

    function addMessage(message, username, userId, timestamp) {
        let messageContainer = document.getElementById('chat-list');
        let messageElement = document.createElement('li');

        let time = new Date(timestamp);
        let now = new Date();
        let timeString = '';
        if (time.getDate() !== now.getDate() || time.getMonth() !== now.getMonth() || time.getFullYear() !== now.getFullYear()) {
            timeString = time.getDate() + '/' + (time.getMonth() < 10 ? "0" : "") + time.getMonth() + '/' + time.getFullYear() + ' '
        }
        timeString += time.getHours() + ':' + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();

        if (userId === userInfo.id) {
            messageElement.classList.add('me');
        }
        messageElement.innerHTML = `
            <div class="name">
                <span class="">${username}</span>
            </div>
            <div class="message">
                <p>${message}</p>
                <span class="msg-time">${timeString}</span>
            </div>`

        messageContainer.appendChild(messageElement);
        document.getElementsByClassName('chat-list')[0].scrollTop = document.getElementsByClassName('chat-list')[0].scrollHeight;
    }

    document.getElementById('send-btn').addEventListener('click', sendMessage)

    document.getElementById('message-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') sendMessage();
    })

    socket.on('message', (data) => {
        let message = data.message;
        let username = data.username;
        let userId = data.userId;

        addMessage(message, username, userId, new Date());
    })

    socket.on('list_connected_users', (users) => {
        let list = document.getElementById('list-connected-users');
        list.innerHTML = '';
        users.forEach((user) => {
            let userElement = document.createElement('li');
            userElement.innerHTML = `<li><span class="status online"><i class="fa fa-circle-o"></i></span><span>${user}</span></li>`;
            list.appendChild(userElement);
        })
    })
})()