const fs   = require('fs');
const path = require('path');
//Global arrays to contain employee and department data
//
let employees   = [];
let departments = [];

//Blocking Helper function to load a array
//      inputs: file : name of .json file
//          reject : Promise reject function
function readFile(file, reject){
    try {
        return  JSON.parse( fs.readFileSync(path.join(__dirname, '/data/'+ file +'.json'), 'utf8'));
    } catch (err){
        reject("unable to read file: "+ file);
    }
}

module.exports = {
    //Blocking function to load elements into JSON arrays
    initialize(){
        return new Promise(
            (resolve, reject) => {
                employees   = readFile('employees', reject);
                departments = readFile('departments', reject);
                resolve();
            }
        );
    },

    //Function to add an employee to the database
    //
    addEmployee(employeeData){
        return new Promise(
            (resolve, reject)=>{
                employeeData['employeeNum'] = employees.length + 1;
                employeeData['isManager']   = employeeData.hasOwnProperty('isManager');
                employees.push(employeeData);
                resolve();
            }
        );
    },

    //Function to provide the full array of employee objects
    //
    getAllEmployees(){
        return createPromise(employees);
    },

    //Function to provide the employees which are managers
    //
    getManagers(){
        return createPromise(employees, "isManager", true);
    },

    //Function to provide the full array of department objects
    //
    getDepartments(){
        return createPromise(departments);
    },

    //Function to get all employees with either "Full Time" or "Part Time" as status
    //
    getEmployeesByStatus(status){
        return createPromise(employees, "status", status);
    },

    //Function to get all employees in the department
    //
    getEmployeesByDepartment(department){
        return createPromise(employees, "department", department);
    },

    //Function to get all employees in the department
    //
    getEmployeesByManager(manager){
        return createPromise(employees, "employeeManagerNum", manager);
    },

    //Function to get employee with the number
    //
    getEmployeeByNum(num){
        return employee(num, (emp)=>{return emp});
    },

    //Function to return a promise which updates an employee based on data
    //
    updateEmployee(data){
        return employee(data.employeeNum, (emp)=>{
            Object.assign(emp, data);
            emp['isManager'] = data.hasOwnProperty('isManager');
        });
    }
} //END module.exports
function employee(num, funct){
    return new Promise(
        (resolve, reject)=>{
            let emp;
            for(let i=0; i < employees.length; i++){
                if(employees[i].employeeNum == num){
                    emp = employees[i];
                    break;
                }
            }
            if(emp != undefined){
                resolve(funct(emp));
            } else {
                reject('Employee not Found');
            }
        }
    )
}

// Function to create a promise object
//      inputs : 
//          array : request to be formated
//          key : value : will filter the employees list to only return those with those pairs
//      outputs :
//          new Promise
//
function createPromise(array, key = 0, value = 0 )
{
    return new Promise(
        (resolve, reject) => {
            if(key != 0){
                array = array.filter( (data)=>{ return data[key] == value});
            }
            if(array.length == 0) 
                reject('no results')
            else
                resolve(array);
        }
    );
}