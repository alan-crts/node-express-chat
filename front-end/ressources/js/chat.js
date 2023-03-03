let userInfo = {};
let numberOfMessages = 0;

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
                        <i class="fa fa-times"></i>
                    </a>
                </li>`;
        })
    } else {
        paramUserId = "all";
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
            console.log(url)
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

        numberOfMessages++;
        document.getElementById('nb-messages').innerText = numberOfMessages;

        addMessage(message, username, userId, new Date());
    })

    socket.on('list_connected_users', (users) => {
        let list = document.getElementById('list-connected-users');
        list.innerHTML = '';

        users.forEach((user) => {
            let userElement = document.createElement('li');
            userElement.innerHTML = `<span class="status online"><i class="fa fa-circle-o"></i></span><span>${user.username}</span>`;
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
                    document.getElementById('modal-container').classList.add('show-modal')
                })
            })
            list.appendChild(userElement);
        })
    })
})()