let userInfo = {};
let numberOfMessages = 0;
let notified = [];
(function() {
    document.getElementById("modal-close-button").addEventListener('click', closeModal)

    function closeModal() {
        const modalContainer = document.getElementById('modal-container')
        modalContainer.classList.remove('show-modal');
    }

    const server = 'http://127.0.0.1:3000'
    const socket = io(server, { auth: { token: localStorage.getItem('token') } });
    // check if param userid in url
    const urlParams = new URLSearchParams(window.location.search);
    let paramUserId = urlParams.get('userid');

    if (paramUserId) {
        //get user info
        fetch(`${server}/user/${paramUserId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then((res) => {
            if (res.status === 404) {
                document.location.href = '/front-end/chat.html';
            } else if (res.status === 401) {
                document.location.href = '/front-end/auth/login.html';
            } else if (res.status === 200) {
                return res.json()
            }
        }).then((data) => {
            document.getElementById('conversation-list').innerHTML += `
            <li class="item active">
                    <a href="#">
                        <i class="fa fa-user"></i>
                        <span>${data.username}</span>
                    </a>
                </li>`;
        })
        document.getElementById('general-tab').children[0].href = '/front-end/chat.html';
    } else {
        paramUserId = "all";
        document.getElementById('general-tab').classList.add('active');
    }

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
            let url = paramUserId === "all" ? `${server}/message` : `${server}/message/${paramUserId}`;
            fetch(`${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }).then((resMessages) => {
                return resMessages.json()
            }).then(async(dataMessages) => {
                document.getElementById('title').innerHTML += ` - ${data.username}`;
                numberOfMessages = dataMessages.length;

                document.getElementById('nb-messages').innerText = numberOfMessages;
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
            if (paramUserId === "all") {
                socket.emit('message', { message });
            } else {
                socket.emit('message', { message, receiverId: paramUserId });
            }
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
        let receiverId = data.receiverId;

        if (receiverId && (receiverId === userInfo.id || receiverId === paramUserId)) {
            //send notification
            if (paramUserId === "all") {
                if (notified.includes(userId)) {
                    let badge = document.getElementById(`badge-${userId}`);
                    badge.dataset.badge = parseInt(badge.dataset.badge) + 1;
                } else {
                    notified.push(userId);
                    document.getElementById('conversation-list').innerHTML += `
                    <li class="item">
                        <a href="/front-end/chat.html?userid=${userId}" class="notification-badges">
                            <i class="fa fa-user"></i>
                            <span data-badge="1" id="badge-${userId}">${username}</span>
                        </a>
                    </li>`;
                }
                return;
            }

            numberOfMessages++;
            document.getElementById('nb-messages').innerText = numberOfMessages;

            addMessage(message, username, userId, new Date());
        } else {
            if (paramUserId !== "all") return;

            numberOfMessages++;
            document.getElementById('nb-messages').innerText = numberOfMessages;

            addMessage(message, username, userId, new Date());
        }
    })

    socket.on(userInfo.privateToken, (data) => {
        if (paramUserId === "all") return;

        let message = data.message;
        let username = data.username;
        let userId = data.userId;

        if (userId !== paramUserId) return;

        numberOfMessages++;
        document.getElementById('nb-messages').innerText = numberOfMessages;

        addMessage(message, username, userId, new Date());
    })

    socket.on('list_connected_users', (users) => {
        let list = document.getElementById('list-connected-users');
        list.innerHTML = '';

        users.forEach((user) => {
            let userElement = document.createElement('li');
            userElement.innerHTML = `<span class="status online"><i class="fa-solid fa-circle"></i></span><span>${user.username}</span>`;
            userElement.addEventListener('click', () => {
                fetch(`${server}/user/${user.userId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }).then((res) => {
                    return res.json()
                }).then((data) => {
                    document.getElementById('modal-username').innerText = data.username;
                    document.getElementById('modal-nb-messages').innerText = data.numberOfMessages;
                    document.getElementById('modal-user-id').innerText = data.id;
                    document.getElementById('private-button').onclick = () => {
                        document.location.href = `/front-end/chat.html?userid=${data.id}`;
                    }
                    document.getElementById('modal-container').classList.add('show-modal')
                })
            })
            list.appendChild(userElement);
        })
    })
})()