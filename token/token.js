const jwt = require('jsonwebtoken');
const serect = 'withxy';

const token = {
    getToken: (token,secret) => {
        console.log(token.slice(7))
        let verify = jwt.verify(token.slice(7), secret, (error, decoded) => {
            if(error) {
                return "Token Invalid"
            }
            return decoded
        })
        return verify
    },
    setToken:(userinfo) => {
        const token = jwt.sign({
            user : userinfo.user,
            id : userinfo.id
        },serect,{expiresIn : '1h'})
        return token;
    }
}
module.exports = token