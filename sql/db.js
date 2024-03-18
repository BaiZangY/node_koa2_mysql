const Client = require('mysql-pro');
const db = new Client({
    mysql:{
        host:'localhost',
        port:3306,
        database:'database',
        user:'user',
        password:'password'
    }
})

module.exports = db
