let userInfo = {};

(function() {
    const server = 'http://127.0.0.1:3000'
    const socket = io(server);

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

            let element = document.getElementsByClassName("page-loader")[0];

            element.classList.add("fade-out");
            setTimeout(() => {
                element.remove();
            }, 1000);
        }
    })
})()