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
            }).then((res) => {
                return res.json()
            }).then((data) => {
                data.forEach((message) => {
                    addMessage(message.message, message.username, message.userId);

                    let element = document.getElementsByClassName("page-loader")[0];

                    element.classList.add("fade-out");
                    setTimeout(() => {
                        element.remove();
                    }, 1000);
                })
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

    function addMessage(message, username, userId) {
        let messageContainer = document.getElementById('chat-list');
        let messageElement = document.createElement('li');

        if (userId === userInfo.id) {
            messageElement.classList.add('me');
        }
        messageElement.innerHTML = `
            <div class="name">
                <span class="">${username}</span>
            </div>
            <div class="message">
                <p>${message}</p>
                <span class="msg-time">5:00 pm</span>
            </div>`

        messageContainer.appendChild(messageElement);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    document.getElementById('send-btn').addEventListener('click', sendMessage)

    document.getElementById('message-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') sendMessage();
    })

    socket.on('message', (data) => {
        let message = data.message;
        let username = data.username;
        let userId = data.userId;

        addMessage(message, username, userId);
    })
})()