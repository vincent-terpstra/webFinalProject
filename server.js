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
const client  = require('client-sessions');
const data    = require('./data-server.js');
const auth    = require('./data-server-auth.js');


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
                    (app.locals.path == url.substr(0,6) ? 
                            ' class="active" ' : '') +
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

//Setup client-sessions

app.use(client({
    cookieName: "session",
    secret: "thisshouldbealongunguessablestring",
    duration: 2 * 60 * 1000, //2 minutes
    activeDuration: 60 * 1000 //extend length one minute per activity
}));

app.response.errorPage = function(code, data){
    this.status(code);
    this.render('error', {title:code, errorMessage:data});
}
app.response.dataPromise = function (promise, page, title){
    let json = {title: title}
    promise
        .then((data)=>{ json[page] = data;})
        .catch((err)=>{ json.message = err;})
        .then(()=>{this.render(page, json);});
}
app.response.redirectPromise = function(promise,page, message){
    promise
        .then( ()=>{this.redirect(page)})
        .catch(()=>{this.errorPage(500, message)} );
}

//Setup middleware
app.use(function(req, res, next){
    //Fixed the menu bar to highlight correctly on update/add pages
    app.locals.path = req.path.substr(0,6);
    //Transfer over session cookies
    res.locals.session = req.session;

    //Update all routes to ensure login
    if(!req.session.user && (
        req.path.startsWith('/employee') ||
        req.path.startsWith('/department') ||
        req.path.startsWith('/loginHistory') ||
        req.path.startsWith('/image'))
    ){
        res.redirect('/login');
    } else {
        next();
    }
});

function createRoute(title , route, page = 0){
    app.get('/'+route, (req, res)=> res.render(page == 0 ? route : page, {title:title}))
}
// setup routes
//
createRoute('Home', '', 'home');
createRoute('About', 'about');
createRoute('Login', 'login');
createRoute('History', 'userHistory');
app.post('/login', (req, res)=>{
    req.body.userAgent = req.get('User-Agent');
    auth.checkUser(req.body)
        .then((user)=>{ 
            req.session.user = {
                userName: user.userName,
                email:    user.email,
                loginHistory: user.loginHistory
            }
            res.redirect('/employees');
        })
        .catch((err)=>{ res.render('login', {title:'ERROR!', errorMessage:err, userName:req.body.userName}); })
});
createRoute('Welcome', 'register');
app.post('/register', (req, res)=>{
        let json = {title:'Welcome'};
        auth.registerUser(req.body)
            .then(()=>{ 
                json.title = 'Success!'; 
                json.successMessage ='User created'
            })
            .catch((err)=>{
                json.errorMessage = err; 
                json.userName = req.body.userName;
                json.email    = req.body.email;
            })
            .then(()=>res.render('register', json));
    }
);
app.get('/logout', (req, res)=>{
    req.session.reset();
    res.redirect('/');
});

app.get('/departments',
    (req, res)=>{
        res.dataPromise(data.getDepartments(), 'departments', 'Departments');
    }
);
createRoute("Add Department", 'departments/add', 'addDepartment');
app.post('/departments/add', (req, res)=>{
    res.redirectPromise(data.addDepartment(req.body), '/departments', "Unable to Add Department");
    }
);

app.post("/department/update", (req, res) => {
    res.redirectPromise(data.updateDepartment(req.body), '/departments', "Unable to Update Department");
});

app.get('/departments/delete/:departmentId', (req, res)=>{
    res.redirectPromise(data.deleteDepartmentById(req.params.departmentId), '/departments',
        "Unable to Remove Department / Department not found")
});

app.get('/department/:departmentId', (req, res)=>{
    data.getDepartmentById(req.params.departmentId)
        .then((dept)=> {res.render('department', {title:'Modify Department', department: dept})})
        .catch(()=>{res.errorPage(404, "Department Not Found")});
});

//app.get('/managers',        getJSON(data.getManagers));

app.get('/employees', (req, res)=>{
        const functs = {
            status     : data.getEmployeesByStatus,
            department : data.getEmployeesByDepartment,
            manager    : data.getEmployeesByManager
        }
        let str = Object.keys(req.query)[0];
        let makePromise = functs[str];
        if(makePromise == undefined) makePromise = data.getAllEmployees;
        res.dataPromise(makePromise(req.query[str]), 'employees', 'Employees');
    }
);

app.get('/employee/:empNum', 
    (req, res)=>{
        let json = {title: 'Modify Employee'};
        data.getEmployeeByNum(req.params.empNum)
            .then((emp)=>{ json['employee'] = emp;})
            .then(data.getDepartments)
            .then((dept) =>{json['departments'] = dept;})
            .then(()=> {res.render('employee', json);})
            .catch(()=>{res.errorPage(404, "Employee Not Found")})   
    }
);

app.get('/employees/add', 
    (req, res)=>{
        data.getDepartments()
            .then((data)=>{res.render('addEmployee', {title: 'Add Employee', departments: data});});
    }
);

app.get('/employees/delete/:empNum', (req, res)=>{
    res.redirectPromise(data.deleteEmployeeByNum(req.params.empNum), '/employees', 
        "Unable to Remove Employee / Employee not found")
});

app.post('/employees/add', (req, res)=>{
    res.redirectPromise(data.addEmployee(req.body), '/employees', "Unable to add Employee")}
);

app.post("/employee/update", (req, res) => {
    res.redirectPromise(data.updateEmployee(req.body), "/employees", "Unable to Update Employee")
});

app.get('/images', 
    (req, res) => {
        return new Promise((resolve, reject)=>{
            fs.readdir('./public/images/uploaded', 
                (err, items)=>{ resolve({title: 'Images', images : items});}
            )
        }).then((data)=>{res.render('images', data)});
    }
);

createRoute('Add Image', 'images/add', 'addImage');
app.post('/images/add', upload.single("imageFile"), (req, res)=>{ res.redirect('/images')});

// Setup 404 message if page not found
app.use((req, res) => { res.errorPage(404, "Page Not Found"); });

// setup http server to listen on HTTP_PORT
//
data.initialize()
    .then(auth.initialize)
    .then(()=>{app.listen(HTTP_PORT, 
         ()=>console.log("Express http server listening on: " + HTTP_PORT))})
    .catch(console.log);
    /*
    .then(()=>auth.registerUser({userName: 'test', password: 'test', password2: 'not-test'}))
    .catch(console.log)
    .then(()=>auth.registerUser({userName: 'test', password: 'test', password2: 'test'}))
    .catch(console.log)
    .then(()=>auth.checkUser({userName:'test', password:'test', userAgent:'testAgent'}))
    .catch(console.log)
    .then(()=>auth.checkUser({userName:'test', password:'test', userAgent:'testAgent2'}))
    .catch(console.log)
    .then(()=>auth.checkUser({userName:'test2', password:'test', userAgent:'testAgent'}))
    .catch(console.log)
    .then(()=>auth.checkUser({userName:'test', password:'not-test', userAgent:'testAgent'}))
    .catch(console.log);
    */

const HTTP_PORT = process.env.PORT || 8080;