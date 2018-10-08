/*********************************************************************************
* WEB322 – Assignment 02
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students. *
* Name: _Vincent Terpstra_ Student ID: _140665175_ Date: _Sept 26 2018_ *
* Online (Heroku) Link: _https://pacific-forest-24614.herokuapp.com/_
* ********************************************************************************/

var HTTP_PORT = process.env.PORT || 8080;

var express = require('express');
var path    = require('path');
var data    = require('./data-server.js');

var app     = express();

// setup routes to return html files
//
app.use(express.static('public'));

// Function to creates get function for HTML file
//      file: name of html file
//
function getHTML(file){
    return (req, res) =>{
        res.sendFile(path.join(__dirname, '/views/'+ file +'.html'))
    }
}

// Function that creates get function for a Promise which returns JSON data
//      funct : function call to data-server create promise
//
function getJSON(makePromise){
    return (req, res)=>{
        //call request for data then post to page
        makePromise()
            //return data in form of json array
            .then((data) => {res.json( data )})
            //return error in form of json message
            .catch((err) => {res.json('{message:"'+ err +'"}');});
    }
}

app.get('/',                getHTML('home'));
app.get('/about',           getHTML('about'));
app.get('/employees/add',   getHTML('addEmployee'));
app.get('/images/add',      getHTML('addEmployee'));
app.get('/managers',        getJSON(data.getManagers));
app.get('/employees',       getJSON(data.getAllEmployees));
app.get('/departments',     getJSON(data.getDepartments));


// Setup 404 message if page not found
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// setup http server to listen on HTTP_PORT
//
data.initialize()
    .then(()=>{app.listen(HTTP_PORT, onHttpStatus)})
    .catch((err)=>{ console.log(err) });

var onHttpStatus = () =>{
    console.log("Express http server listening on: " + HTTP_PORT );
};