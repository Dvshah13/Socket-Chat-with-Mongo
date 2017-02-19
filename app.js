var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
    nicknames = [];

server.listen(3000);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.socket.on('connection', function(socket){
    socket.on('new user', function(data, callback){
        if (nicknames.indexOf(data) != -1) {
            callback(false);
        }
    });
})

io.sockets.on('connection', function(socket){
    socket.on('send message', function(data){
        io.sockets.emit('new message', data);
        //to send to every user besides one who sent message use code below:
        // socket.broadcast.emit('new message', data);
    });
});
