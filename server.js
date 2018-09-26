var HTTP_PORT = process.env.PORT || 8080;

var express = require('express');
var path    = require('path');
var data    = require('./data-server.js');

var app     = express();

// setup routes to return html files
//
app.use(express.static('public'));

// Function to setup page requests
//      inputs
//          str : get location ex /about
//          file: name of html file
//
function createRequest(str, file){
    app.get(str, (req, res)=>{
        res.sendFile(path.join(__dirname, '/views/'+ file +'.html'));
    });
}

createRequest('/', 'home');
createRequest('/about', 'about');

// Function that creates an app get request
//      inputs 
//          str   : get location ex /managers
//          funct : function call to data-server exported function
//
function createGet(str, funct){
    app.get(str, 
        (req, res)=>{
        //call request for data then post to page
        funct()
            //return data in form of json array
            .then((data) => {res.json( data )})
            //return error in form of json message
            .catch((err) => {res.json('{message:"'+ err +'"}');});
        }
    );
}

createGet('/managers',    data.getManagers);
createGet('/employees',   data.getAllEmployees);
createGet('/departments', data.getDepartments);

// Setup 404 message if page not found
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// setup http server to listen on HTTP_PORT
//
data.initialize()
    .then(()=>{app.listen(HTTP_PORT, onHttpStatus)})
    .catch((err)=>{ console.log(err) });

var onHttpStatus = function(){
    console.log("Express http server listening on: " + HTTP_PORT );
};