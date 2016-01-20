var express = require('express');
var path = require('path');

var app = express();
//__dirname points to the current directory. /../ goes up a directory level
var rootPath = path.normalize(__dirname);
//express.static() serves files in a directory w/out processing them
app.use(express.static(rootPath + '/app'));
app.use(express.static(rootPath + '/app/dist'));
app.use(express.static(rootPath + '/bower_components'));

app.listen(process.env.PORT, process.env.IP);
console.log("Listening...");