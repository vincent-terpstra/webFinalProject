/*********************************************************************************
* WEB322 – Assignment 03
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students. *
* Name: _Vincent Terpstra_ Student ID: _140665175_ Date: _Oct 12 2018_ *
* Online (Heroku) Link: _https://pacific-forest-24614.herokuapp.com/_
* ********************************************************************************/

const express = require('express');
const app     = express();

const fs      = require('fs');
const path    = require('path');
const data    = require('./data-server.js');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true }));

const multer = require('multer');
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// setup routes to return html files
//
app.use(express.static('./public/'));

// Function to creates get function for HTML file
//      file: name of html file
//
function getHTML(file){
    return (req, res) =>{
        res.sendFile(path.join(__dirname, '/views/'+ file +'.html'))
    }
}

// Function that creates get function for a Promise which returns JSON data
//      makePromise : function call to data-server to create a Promise
//
function getJSON(makePromise, flag){
    //return function for posting json data
    return (req, res)=>{
        resolveJSON(makePromise(flag), res);      
    }
}

//Function to add then and catch to a promise to deal with JSON
//
function resolveJSON(promise, res){
    promise
        //return data in form of json array
        .then((data) => {res.json( data )})
        //return error in form of json message
        .catch((err) => {res.json(  { "message" : err });});
}

app.get('/',                getHTML('home'));
app.get('/about',           getHTML('about'));
app.get('/employees/add',   getHTML('addEmployee'));
app.get('/images/add',      getHTML('addImage'));

app.get('/managers',        getJSON(data.getManagers));
app.get('/departments',     getJSON(data.getDepartments));
app.get('/employees', (req, res)=>{
        //check status flag
        let makePromise = data.getAllEmployees;
        let value;
        const query = req.query;
        
        switch(Object.keys(query)[0]){
            case 'status':
                makePromise = data.getEmployeesByStatus;
                value = query.status;
                break;
            case 'department':
                makePromise = data.getEmployeesByDepartment;
                value = query.department;
                break;
            case 'manager':
                makePromise = data.getEmployeesByManager;
                value = query.manager;
                break;
        }
        resolveJSON(makePromise(value), res);
    }
);
app.get('/employees/:num', (req, res)=>
    {
    //check status flag
    data.getEmployeeByNum(req.params.num)
        .then((data)=>{res.json(data[0])})
        .catch((err)=>{res.json({"message" : err});});
    }
);

app.post('/employees/add', (req, res)=>
    {
    data.addEmployee(req.body)
        .then( ()=>(res.redirect('/employees')))
        .catch((err)=>{ console.log(err)} );
    }
);

app.get('/images', (req, res) =>
    {
    resolveJSON(new Promise((resolve, reject) => {
            fs.readdir('./public/images/uploaded', 
                (err, items)=>{ resolve({"images" : items});}
            )
        }), res)
    }
)
app.post('/images/add', upload.single("imageFile"), 
    (req, res)=>{ res.redirect('/images')}
);

// Setup 404 message if page not found
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// setup http server to listen on HTTP_PORT
//
data.initialize()
    .then(()=>{app.listen(HTTP_PORT, onHttpStatus)})
    .catch((err)=>{ console.log(err) });

const HTTP_PORT = process.env.PORT || 8080;
const onHttpStatus = () =>{
    console.log("Express http server listening on: " + HTTP_PORT );
};