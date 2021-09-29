const Socket = require('websocket').server

const http = require('http').createServer()

const webSocket = new Socket({httpServer: http})

let users = []
webSocket.on('request', (request) => {
    const connection = request.accept(null, request.origin)
    console.log('Connection accepted')
    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data)
            connection.sendUTF(message.utf8Data)

            const data = JSON.parse(message.utf8Data)

            const user = findUser(data.username)

            switch (data.type) {
                case "store_user":

                    if (user) {
                        connection.sendUTF(JSON.stringify({
                            type: "error",
                            message: "Username already exists"
                        }))
                    }

                    const newUser = {
                        conn : connection,
                        username : data.username,
                    }

                    users.push(newUser)
                    console.log(newUser.username + ' has joined the chat');
                    break;
                
                case "store_offer":
                    if (user == null) {
                        return
                    }

                    user.offer = data.offer
                    break;
                
                case "store_candidate":
                    if (user == null) {
                        return
                    }    

                    if(user.candidates == null) {
                        user.candidates = []
                    }
                        
                    user.candidates.push(data.candidate)
                    break;
                
                case "send_answer":
                    if (user == null) {
                        return
                    }

                    sendData({
                        type: "answer",
                        answer: data.answer,
                    }, user.conn)

                    break;
                
                case "send_candidate":
                    if (user == null) {
                        return
                    }
                    
                    sendData({
                        type: "candidate",
                        candidate: data.candidate,
                    }, user.conn)
                
                    break;
                
                case "join_call":
                    if (user == null) {
                        return
                    }

                    sendData({
                        type: "offer",
                        offer: user.offer,
                    }, connection)

                    user.candidates.forEach(candidate => { 
                        sendData({
                            type: "candidate",
                            candidate: candidate,
                        }, connection)
                    })

                    break;
                default:
                    console.log('Unknown message type');
                    break;
            }

        }
    })
    connection.on('close', (reason, description) => {
        users.forEach((user, index) => {
            if (user.conn === connection) {
                users.splice(users.indexOf(user), 1)
                console.log(user.username + ' has left the chat');
            }
        })
        console.log('Connection closed')
    })
})


const sendData = (data, conn) => {
    conn.sendUTF(JSON.stringify(data))
}

const findUser = (username) => {
    for (let i = 0; i < users.length; i++) {
        if (users[i].username === username) {
            return users[i]
        }
    }
}


http.listen(3000, () => {
    console.log('WEBSOCKET on ws://localhost:3000 ')
})