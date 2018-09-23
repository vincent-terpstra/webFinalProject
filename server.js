var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var path = require("path");
var app = express();

var onHttpStatus = function(){
    console.log("Express http server listening on: " + HTTP_PORT );
};

// setup routes to return html files
//
app.use(express.static('public'));

// function to setup page requests
//
function createRequest(str, file){
    app.get(str, (req, res)=>{
        res.sendFile(path.join(__dirname, '/views/'+ file +'.html'));
    });
}

createRequest('/', 'home');
createRequest('/about', 'about');

// setup http server to listen on HTTP_PORT
//
app.listen(HTTP_PORT, onHttpStatus);
