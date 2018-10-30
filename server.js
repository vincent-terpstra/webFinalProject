/*********************************************************************************
* WEB322 – Assignment 04
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students. *
* Name: _Vincent Terpstra_ Student ID: _140665175_ Date: _Oct 29 2018_ *
* Online (Heroku) Link: _https://pacific-forest-24614.herokuapp.com/_
* ********************************************************************************/

const express = require('express');
const app     = express();

const fs      = require('fs');
const path    = require('path');
const data    = require('./data-server.js');

//Setup Body Parser for uploading forms (add employee)
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true }));

//Set up multer for multidata forms ( images )
const multer = require('multer');
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

//Setup Handlebars fo templating
const exphbs = require("express-handlebars");
app.engine('.hbs',
    exphbs({
        extname: '.hbs', 
        defaultLayout: 'main',
        helpers: {
            navLink: function(url, options){
                return '<li' +
                    ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                    '><a href="' + url + '">' + options.fn(this) + '</a></li>';
            },
            radio: function(empstatus, options){
                let id = options.fn(this);
                return '<label class="checkbox-inline">' +
                            '<input type="radio" id="'+ id +
                            '" name="status" value="'+ id +'"' +
                            (id == empstatus ? 'checked' : '') +' />'+ id + 
                        '</label>';
            },
            option: function(empstatus, idx,  options){
                return '<option value="' + idx + '" '+ 
                    (idx == empstatus ? 'selected' : '')
                    +'>'+options.fn(this)+'</option>';
            },
            with: function(context, options){
                return options.fn(context);
            },
            column : function(size, options){
                return'<div class="col-md-'+ size +'"><div class="form-group">'+
                    options.fn(this) +'</div></div>';
            },
            input : function(id, label, type, value, option){
                return '<label for="'+ id +'">'+ label +':</label>'+
                    '<input class="form-control" id="'+ id + 
                    '" name="'+ id +'" type="'+type +
                    '" value="'+ (value == null ? '' : value) +'" ' + option.fn(this) +' />';
            }
        }
    })
);
app.set('view engine', '.hbs');

app.use(express.static('./public/'));

//Setup route to fix active link in hbs
app.use(function(req,res,next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

// Function that creates get function for a handlebars file
//      file : name of the file
function getHBS(file, title = "My App"){
    return (req, res)=>{
        res.render(file, {'title': title});
    }
}

// setup routes
//
app.get('/',                getHBS('home', 'Home'));
app.get('/about',           getHBS('about', 'About'));
app.get('/employees/add',   getHBS('addEmployee', 'Add Employee'));
app.get('/images/add',      getHBS('addImage', 'Add Image'));

//Function which sets up .then and .catch for a query promise
//
function responseHBS(promise, res, page, title){
    let json = {title: title}
    promise.then((data)=>{
        json[page] = data;
        res.render(page, json);
    }).catch((err)=>{
        json['message'] = err;
        res.render(page, json);
    })
}

//app.get('/managers',        getJSON(data.getManagers));
app.get('/departments',
    (req, res)=>{
        responseHBS(data.getDepartments(), res, 'departments', 'Departments');
    }
);
app.get('/employees', (req, res)=>{
        
        let makePromise = data.getAllEmployees;
        let value;
        const query = req.query;
        
        //check status flag
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
        responseHBS(makePromise(value), res, 'employees', 'Employees');
    }
);

app.get('/employees/:num', 
    (req, res)=>{   
        responseHBS(data.getEmployeeByNum(req.params.num), res, 'employee', 'Modify Employee')
    }
);

app.post('/employees/add', (req, res)=>
    {
    data.addEmployee(req.body)
        .then( ()=>(res.redirect('/employees')))
        .catch((err)=>{ console.log(err)} );
    }
);

app.post("/employee/update", (req, res) => {
    data.updateEmployee(req.body)
        .then( ()=>{res.redirect("/employees");})
        .catch(()=>{res.redirect("/employees")});
});

app.get('/images', 
    (req, res) => {
        return new Promise((resolve, reject)=>{
            fs.readdir('./public/images/uploaded', 
                (err, items)=>{ resolve({"title": 'Images', "images" : items});}
            )
        }).then((data)=>{res.render('images', data)});
    }
);

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