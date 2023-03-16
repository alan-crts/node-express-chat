let userInfo = {};
let numberOfMessages = 0;
const notifications = document.querySelector(".notifications");

(async function() {
        document.getElementById("modal-close-button").addEventListener('click', closeModal)

        function closeModal() {
            const modalContainer = document.getElementById('modal-container')
            modalContainer.classList.remove('show-modal');
        }

        function getOpenedConversation() {
            return localStorage.getItem('openedConversation') ? JSON.parse(localStorage.getItem('openedConversation')) : {};
        }

        function addOpenedConversation(id, username) {
            let openedCoversations = getOpenedConversation();
            openedCoversations[id] = username;
            localStorage.setItem('openedConversation', JSON.stringify(openedCoversations));
        }

        function removeConversation(id) {
            let openedCoversations = getOpenedConversation();
            delete openedCoversations[id];
            localStorage.setItem('openedConversation', JSON.stringify(openedCoversations));
            document.getElementById(`conversation-${id}`).remove();
            if (id == paramUserId) {
                document.location.href = '/front-end/chat.html';
            }
        }

        function addConversationHTML(id, username, active = false, badge = 0) {
            document.getElementById('conversation-list').innerHTML += `
                        <li class="item${active == true ? " active" : ""}" id="conversation-${id}">
                                <a href="${active == true ? "#" : "?userid=" + id}" class="notification-badges">
                                    <i class="fa fa-user"></i>
                                    <span ${badge != 0 ? `data-badge="${badge}"` : ""} id="badge-${id}">${username}</span>
                                    <i class="fa fa-times"></i>
                                </a>
                            </li>`;
        document.getElementById(`conversation-${id}`).children[0].children[2].addEventListener('click', (e) => {
            e.preventDefault();
            removeConversation(id);
        })
    }

    function appendConversation() {
        fetch(`${server}/message/user/unread`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then((resunread) => {
            return resunread.json()
        }).then(async(dataunread) => {
            await dataunread.forEach((unread) => {
                addOpenedConversation(unread._id, unread.username);
                addConversationHTML(unread._id, unread.username, false, unread.count);
            })
        }).then(() => {
            let openedCoversations = getOpenedConversation();
            for (const [key, value] of Object.entries(openedCoversations)) {
                if (document.getElementById(`conversation-${key}`) == null) {
                    addConversationHTML(key, value, key == paramUserId);
                }
            }
        })
    }

    const removeToast = (toast) => {
        toast.classList.add("hide");
        if(toast.timeoutId) clearTimeout(toast.timeoutId); 
        setTimeout(() => toast.remove(), 500); 
    }
    
    const createToast = (message, type) => {
        const toast = document.createElement("li"); 
        toast.className = `toast ${type}`; 

        toast.innerHTML = `<div class="column">
                             <i class="fa-solid fa-circle-info"></i>
                             <span>${message}</span>
                          </div>
                          <i class="fa-solid fa-xmark" onclick="removeToast(this.parentElement)"></i>`;
        notifications.appendChild(toast);

        toast.timeoutId = setTimeout(() => removeToast(toast), 3500);
    }

    const server = 'http://127.0.0.1:3000'
        // check if param userid in url
    const urlParams = new URLSearchParams(window.location.search);
    let paramUserId = urlParams.get('userid');

    if (paramUserId) {
        //get user info
        await fetch(`${server}/user/${paramUserId}`, {
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
            addOpenedConversation(data.id, data.username);
            //set message read
            fetch(`${server}/message/user/read/${data.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }).then(() => {
                appendConversation()
            })

            document.getElementById('conversation-name').innerText = `Conversation avec ${data.username}`;
        })
        document.getElementById('general-tab').children[0].href = '/front-end/chat.html';
    } else {
        paramUserId = "all";
        appendConversation()
        document.getElementById('general-tab').classList.add('active');
    }

    const socket = io(server, { auth: { token: localStorage.getItem('token') } });

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
                document.getElementById("user-name").innerText = data.username;
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
        messageElement.innerHTML += `<div class="name">
        <span class="">${username}</span>
        </div>
        <div class="message">
        <p>${message}</p>
        <span class="msg-time">${timeString}</span>
        </div>`;

        messageElement.addEventListener('click', () => {
            fetch(`${server}/user/${userId}`, {
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
            if (paramUserId !== userId && userId !== userInfo.id) {
                let openedCoversations = getOpenedConversation();
                if (openedCoversations[userId]) {
                    let badge = document.getElementById(`badge-${userId}`);
                    if (badge.dataset.badge) {
                        badge.dataset.badge = parseInt(badge.dataset.badge) + 1;
                    } else {
                        badge.dataset.badge = 1;
                    }
                } else {
                    addOpenedConversation(userId, username);
                    addConversationHTML(userId, username, false, 1);
                }
                createToast(`${username} vous a envoyé un message privé :<br>${message.length > 25 ? message.substring(0, 25) + '...' : message}`, "info");
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

    document.getElementById('modal-container').addEventListener('click', (e) => {
        if (e.target.id === 'modal-container') {
            document.getElementById('modal-container').classList.remove('show-modal')
        }
    })
})()