//Setup Mongoose module and create a schema variable
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const bcrypt = require('bcryptjs');
//connect to the Database
var connect;

const userSchema = new Schema({
    userName: {
        type: String,
        unique:true
    },
    password: String,
    email:    String,
    loginHistory: [{
        dateTime: Date, 
        userAgent: String 
    }]
});

var User;

module.exports = {
    //Setup the schemas and connect to the database
    async initialize(){
        connect = await Mongoose.createConnection(
            'mongodb://vterpstra:web322vterpstra@ds031792.mlab.com:31792/vterpstra_web322_a6'
        );
        console.log('Mongo DBS Connection established');
        User = connect.model("users", userSchema);
     //   User.remove({}).exec();
    },

    //Register user in the database
    async registerUser(userData){
        if(userData.password != userData.password2)
            throw "Passwords do not match";
        userData.password = await bcrypt.hash(userData.password, 10);
        await new User(userData).save().catch((err)=>{
            if(err.code == 11000) throw("User Name already taken");
            throw "There was an error creating the user: " + err;
        });
    },
    

    //Check if user is valid
    async checkUser(userData){
        let users = await User.find({userName: userData.userName }).exec();
        if(users.length == 0)
            throw "Unable to find User: " + userData.userName;
        let check = await bcrypt.compare(userData.password, users[0].password);
        if(!check)
            throw "Incorrect Password for User: " + userData.userName;

        users[0].loginHistory.push({dateTime: new Date().toString(), userAgent: userData.userAgent});
        User.updateOne(
            { userName: userData.userName },
            { $set: {loginHistory: users[0].loginHistory}}
        ).exec();
        return users[0]; 
    }
}