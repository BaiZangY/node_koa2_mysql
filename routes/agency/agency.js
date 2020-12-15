const request=require('request');
var fs = require("fs");
var image = require("imageinfo");
var cheerio = require('cheerio');
const router = require('koa-router')();

function readFileList(path, filesList) {
    var files = fs.readdirSync(path);
    files.forEach(function (itm, index) {
        var stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
        //递归读取文件
            readFileList(path + itm + "/", filesList)
        } else {

            var obj = {};//定义一个对象存放文件的路径和名字
            obj.path = path;//路径
            obj.filename = itm//名字
            filesList.push(obj);
        }

    })

}

var getFiles = {
    //获取文件夹下的所有文件
        getFileList: function (path) {
            var filesList = [];
            readFileList(path, filesList);
            return filesList;
        },
        //获取文件夹下的所有图片
        getImageFiles: function (path) {
            var imageList = [];
    
            this.getFileList(path).forEach((item) => {
                var ms = image(fs.readFileSync(item.path + item.filename));
    
                ms.mimeType && (imageList.push(item.filename))
            });
            return imageList;
    
        },//获取文件夹下所有非图片的文件 2018年8月18日 19:15:13更新
        getTxtList: function (path) {
    
    
            return this.getFileList(path).filter((item) => {
                var ms = image(fs.readFileSync(item.path + item.filename));
    
                return !ms.mimeType
            });
    
        }
    };

router.prefix('/agency')


router.get("/get", async (ctx, next) => {
    const data = ctx.request.query,
        url = data.url,
        html = data.html || "html";

    await new Promise((req,rej)=>{
        request({
            url:url,
            headers: {
            'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36`
            }
        }, (error, response, body) => {
            console.log(body)
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                var navText=$(html).html();
                req(navText)
            }else{
                rej("出错了")
            }
        })
    }).then(res=>{
        ctx.body = {
            status:200,
            data: res,
        }
    },err => {
        ctx.body = {
            status:400,
            data: err,
        }
    })
});

router.post("/post", async (ctx, next) =>  {
    request({
        url:`http://47.102.147.30:1241/api/getAllInfo`,
        method:'POST',
        headers:{
            'Content-Type':'application/json' 
        }
    },function(error,response,body){
        console.log(body)
        if(!error && response.statusCode==200){
            res.send({ "data": JSON.parse(body), "code":200})
        }
    });
});
router.get("/getFileInfo", async (ctx, next) =>  {
    let editid = ctx.request.query.editid,
        flowid = ctx.request.query.flowid
    let token = await new Promise((req,rej)=>{
        request({
            url:`http://47.111.148.130:8098/login?username=yslbj&password=123456`,
            method:'POST',
            // body: "username=yslbj&password=123456",
            // json: true,
            // headers: {
            //     "content-type": "application/json",
            // },

            // 模拟浏览器请求
            // 'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36`
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36`
            },
        },function(error,response,body){
            req(body)
        });
    }).then(res=>{
        let result = JSON.parse(res)
        return result.token
    },err => {
        ctx.body = {
            status:400,
            data: err,
        }
    })
    // console.log(token)
    await new Promise((req,rej)=>{
        request({
            url:`http://47.111.148.130:8098/only/office/findOnlyOfficeFileInfo`,
            method:'PUT',
            body: {
                editId: editid || "504",
                flowId: flowid || "1982"
            },
            json: true,
            headers: {
                "content-type": "application/json",
                "Authorization": token
            },
            beforeSend: function(xhr) {
                var itemToken = token;
                xhr.setRequestHeader("Authorization", itemToken);
            },
        },function(error,response,body){
            console.log(response.statusCode,body)
            req(body)
        });
    }).then(res=>{
        ctx.body = {
            status:200,
            data: res,
            token:token
        }
    },err => {
        ctx.body = {
            status:400,
            data: err,
        }
    })
    
});
//  get 用 qs  post 用 body
router.get('/getIP', async (ctx, next) => {

    let ip = ctx.request.ip.split(':').pop()
    let key = '4a9b608e59f69937704b20d9efa17d9a'
    console.log(ip)

    await new Promise((req,rej)=>{
        request({
            url:`https://restapi.amap.com/v3/ip?ip=${ip}&output=json&key=${key}`,
            method:'GET'
        },function(error,response,body){
            if (!error && response.statusCode == 200) {
                req(body)
            }else{
                rej("出错了")
            }       
        });
    }).then(res=>{
        let data = JSON.parse(res)
        ctx.body = {
            status:200,
            data: {
                cIP:ip,
                cName:data['province'] + data['city']
            },
        }
    },err => {
        ctx.body = {
            status:400,
            data: err,
        }
    })
})

router.get('/randomImg', async (ctx, next) => {
    let imgList = getFiles.getImageFiles("./public/uploadFile/")
    console.log(imgList)
    // await new Promise((req,rej)=>{
    //     request({
    //         url:`https://restapi.amap.com/v3/ip?ip=${ip}&output=json&key=${key}`,
    //         method:'GET'
    //     },function(error,response,body){
    //         if (!error && response.statusCode == 200) {
    //             req(body)
    //         }else{
    //             rej("出错了")
    //         }       
    //     });
    // }).then(res=>{
    //     let data = JSON.parse(res)
    //     ctx.body = {
    //         status:200,
    //         data: {
    //             cIP:ip,
    //             cName:data['province'] + data['city']
    //         },
    //     }
    // },err => {
    //     ctx.body = {
    //         status:400,
    //         data: err,
    //     }
    // })
})
module.exports = router
