var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
    mongoose = require('mongoose');
    users = {};

server.listen(3000);

mongoose.connect('mongodb://localhost/chatlog', function(err) {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Connected to database!")
    }
});

var chatSchema = mongoose.Schema({
    nickname: String,
    msg: String,
    created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Chat Log', chatSchema);

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
    var query = Chat.find({});
    // sort via descending to show last 10 messages
    query.sort('-created').limit(10).exec(function(err, docs){
        if (err) throw err;
        console.log('Sending old messages')
        socket.emit('Load old messages', docs);
    });
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
                    // private messages aren't saved to database
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
            var newMsg = new Chat({msg: msg, nickname: socket.nickname});
            newMsg.save(function(err){
                if (err) throw err;
            });
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
