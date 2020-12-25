# 介绍

这个是关于node的koa2的项目，使用的是mysql数据库，包括登录验证，文件上传等

如果不需要使用https  可将 /bin/www 中的 

``` JavaScript
var options = require('../httpsServe')

var httpsServer = https.createServer(options,app.callback());

httpsServer.listen(1244);
```
移除即可
