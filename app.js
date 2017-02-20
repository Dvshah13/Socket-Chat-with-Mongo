var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
    users = {};

server.listen(3000);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){
    socket.on('new user', function(data, callback){
        if (data in users) {
            callback(false);
        }
        else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
        }
    });
})

function updateNicknames() {
    io.sockets.emit('usernames', Object.keys(users));
}

io.sockets.on('connection', function(socket){
    socket.on('send message', function(data, callback){
        var msg = data.trim();
        if (msg.substr(0,3) === '/p ') {
            msg = msg.substr(3);
            var index = msg.indexOf(' ');
            if (index !== -1) {
                var name = msg.substring(0, index);
                var msg = msg.substring(index + 1);
                if (name in users) {
                    users[name].emit('new message', {msg: msg, nickname: socket.nickname});
                    console.log("Private!");
                }
                else {
                    callback('Error!  Enter a valid user!');
                }

            }
            else {
                callback('Error! Please enter a message for private message!')
            }

        }
        else {
            io.sockets.emit('new message', {msg: msg, nickname: socket.nickname});
        }
        //to send to every user besides one who sent message use code below:
        // socket.broadcast.emit('new message', data);
    });
socket.on('disconnect', function(data){
    if (!socket.nickname) return;
    delete users[socket.nickname];
    updateNicknames();
})
});
