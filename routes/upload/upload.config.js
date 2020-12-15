const path = require('path');
const router = require('koa-router')();
const fs = require('fs');

const config = {
    getUploadDirName(){
        const date = new Date();
        let month = Number.parseInt(date.getMonth()) + 1;
        month = month.toString().length > 1 ? month : `0${month}`;
        const dir = `${date.getFullYear()}${month}${date.getDate()}`;
        return dir;
    },
    randomWord(max){
        var str = "",
            arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        for(var i=0; i<max; i++){
            pos = Math.round(Math.random() * (arr.length-1));
            str += arr[pos];
        }
        return str;
    },
    getUploadFileName(name){
        let ext = name.split('.');
        ext = ext[ext.length - 1]
        const dir = `${this.randomWord(32)}.${ext}`;
        return dir;
    },
    checkDirExist(p) {
        if (!fs.existsSync(p)) {
          fs.mkdirSync(p);
        }
    }
}

module.exports = config