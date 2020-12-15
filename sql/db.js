const Client = require('mysql-pro');
const db = new Client({
    mysql:{
        host:'47.102.147.30',
        port:3306,
        database:'yslBlog',
        user:'ysl',
        password:'123456'
    }
})

module.exports = db