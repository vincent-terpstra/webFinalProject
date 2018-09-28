var fs = require('fs');
var path = require('path');
//Global arrays to contain employee and department data
//
var employees   = [];
var departments = [];

//Blocking Helper function to load a array
//      inputs: file : name of .json file
//          reject : Promise reject function
function readFile(file, reject){
//    console.log('reading '+file);
    try {
        return  JSON.parse( fs.readFileSync(path.join(__dirname, '/data/'+ file +'.json'), 'utf8'));
    } catch (err){
        reject("unable to read file: "+ file);
    }
}

//Function to load the contents of our .json files into the array
//
module.exports.initialize = function(){
    return new Promise(
        (resolve, reject) =>
        {
            employees   = readFile('employees', reject);
            departments = readFile('departments', reject);
            resolve();
        }
    );
};

// Function to create a promise object
//      inputs : 
//          array : request to be formated
//          funct : function modifies the array (default does nothing)
//      outputs :
//          new Promise
//
function createPromise(array, funct = (list)=>{ return list; })
{
    return new Promise(
        (resolve, reject) => {
            array = funct(array);
            if(array.length == 0) reject("no results returned")
            else
                resolve(array);
        }
    )
};

//Function to provide the full array of employee objects
//
module.exports.getAllEmployees = function(){
    return createPromise(employees);
};

//Function to provide the employees which are managers
//
module.exports.getManagers = function(){
    //Function to select managers from list
    //
    function selectManagers(list){
        var managers = [];
        //add employees to the list if they are a manager
        list.forEach( (data) => { if(data.isManager) managers.push(data);  }  );
        return managers;
    }
    return createPromise(employees, selectManagers);
};

//Function to provide the full array of department objects
//
module.exports.getDepartments = function(){
    return createPromise(departments);
};