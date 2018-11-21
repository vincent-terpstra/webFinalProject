const Sequelize = require('sequelize');
var sequelize = new Sequelize(
    'd7hmhs95b4hmkv',
    'lcdfaftgslific',
    '5d541202b4b84aeceeccf6fffa9a5c0ac0ad4d6b70a4e1e173a21e0feffea3eb',
    {
        host: 'ec2-54-83-8-246.compute-1.amazonaws.com',
        dialect: 'postgres',
        port: '5432',
        dialectOptions: {
            ssl: true
        }
    }
);
//define a departments table
const Employee = sequelize.define('employee', {
        employeeNum : {
            type: Sequelize.INTEGER,
            primaryKey : true,
            autoIncrement: true },
        firstName   : Sequelize.STRING,
        lastName    : Sequelize.STRING,
        email       : Sequelize.STRING,
        SSN         : Sequelize.STRING,
        addressStreet   : Sequelize.STRING,
        addressCity     : Sequelize.STRING,
        addressState    : Sequelize.STRING,
        addressPostal   : Sequelize.STRING,
        maritalStatus   : Sequelize.STRING,
        isManager       : Sequelize.BOOLEAN,
        employeeManagerNum : Sequelize.STRING,
        status      : Sequelize.STRING,
        hireDate    : Sequelize.STRING
    }
);
//define a departments table
const Department = sequelize.define('department', {
        departmentId : {
            type: Sequelize.INTEGER,
            primaryKey : true,
            autoIncrement: true },
        departmentName : Sequelize.STRING
    }
);
Employee['name'] = "Employee";
Employee['key']  = 'employeeNum';
Department['name'] = 'Department';
Department['key']  = 'departmentId';

//Setup the has Many relationship
Department.hasMany(Employee, {foreignKey: 'department'});

module.exports = {
    //Blocking function to load elements into JSON arrays
    initialize(){
        return sequelize.sync()
            .catch((err)=>{throw "unable to sync the database";});
    },

    //Function to add a Department to the Database
    //
    addDepartment(departmentData){
        return insertValues(Department, departmentData);
    },

    //Function to provide the full array of department objects
    //
    getDepartments(){
        return createPromise(Department);
    },
    
    //Function to get a single Department
    //
    getDepartmentById(id){
        return createPromise(Department, 'departmentId', id)
            .then((data)=>{return data[0];});
    },

    //Function to update a Department in the Database
    //
    updateDepartment(departmentData){
        return updateValues(Department, departmentData);
    },

    deleteDepartmentById(id){
        return deleteValues(Department,  id);
    },

    //Function to add an employee to the database
    //
    addEmployee(employeeData){
        employeeData.isManager = employeeData.hasOwnProperty('isManager');
        return insertValues(Employee, employeeData);
    },

    //Function to provide the full array of employee objects
    //
    getAllEmployees(){
        return createPromise(Employee);
    },

    //Function to get employee with the number
    //
    getEmployeeByNum(num){
        return createPromise(Employee, 'employeeNum', num)
            .then((data)=>{return data[0]});
    },

    //Function to provide the employees which are managers
    //
    getManagers(){
        return createPromise(Employee, "isManager", true);
    },

    //Function to get all employees with either "Full Time" or "Part Time" as status
    //
    getEmployeesByStatus(status){
        return createPromise(Employee, "status", status);
    },

    //Function to get all employees in the department
    //
    getEmployeesByDepartment(department){
        return createPromise(Employee, "department", department);
    },

    //Function to get all employees in the department
    //
    getEmployeesByManager(manager){
        return createPromise(Employee, "employeeManagerNum", manager);
    },

    //Function to return a promise which updates an employee based on data
    //
    updateEmployee(employeeData){
        employeeData.isManager = employeeData.hasOwnProperty('isManager');
        return updateValues(Employee, employeeData);
    },

    deleteEmployeeByNum(empNum){
        return deleteValues(Employee, empNum);
    }
} //END module.exports
//Insert values into a table
function insertValues (table, data){
    for(const key in data)
        if(data[key] == "") data[key] = null;
    return table.create(data)
        .catch(()=>{ throw "Unable to Insert Values into " + table.name });
}

//Update values in a table
function updateValues (table, data){
    for(const key in data)
        if(data[key] == "") data[key] = null;
    return table.update(data, {where: {[table.key]: data[table.key]}})
        .catch(()=>{ throw "Unable to Update " + table.name });
}
//Delete values in a table
function deleteValues(table, value){
    return table.destroy({where: {[table.key] : value}})
        .catch(()=>{throw "Unable to Delete Value"});
}

// Function to create a postgres promise object
//      inputs : 
//          array : request to be formated
//          key : value : will filter the table  to only return those with those pairs
//      outputs :
//          new Promise

function createPromise(table, key = 0, value){
        return table.findAll((key == 0 ? {} : {where: {[key]: value}}))
        .then((data)=>{
            if(data.length == 0) throw 'No results returned'
            return data;
        });
}
