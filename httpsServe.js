

var fs = require('fs');

module.exports = {
    key:fs.readFileSync('./file/XXXXXXXXXXXXX.key'),
    cert:fs.readFileSync('./file/XXXXXXXXXXXXX.crt')
  }
