const router = require('koa-router')()
const moment = require('moment')
const request=require('request');
const db = require('../../sql/db')
// 路由前缀
router.prefix('/api')

router.get('/getArticleList', async (ctx, next) => {
    let searchType = ctx.request.query.type;
    let sql = 'select * from blogArticle',
    parms = []
    if(searchType){
        sql = 'select * from blogArticle where tagIndex=?'
        parms.push(searchType)
    }
  await db.query(sql,parms).then(res => {
    // console.log(res);
    if(res.length == 0){
        ctx.body = {
            status:400,
            msg: "未查找到相关内容，请联系管理员后重试",
            data:[]
        }
    }else{
        ctx.body = {
            status:200,
            data: res,
        }
    }
  })
})

router.get('/getArticle', async (ctx, next) => {
    
    let id = ctx.request.query.id
    await db.query('select * from blogArticle where id=?',[id]).then(res => {
        // console.log(res);
        if(res.length == 0){
            ctx.body = {
                status:400,
            }
        }else{
            ctx.body = {
                status:200,
                data: res,
            }
        }
    })
})

router.post('/issueArticle', async (ctx, next) => {
    let issueTime =  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let data = ctx.request.body
    let tagName = ''
    switch(data.tag){
        case '4':
            tagName = '技术分享'
            break;
        case '3':
            tagName = '心情随笔'
            break;
        case "2":
            tagName = '畅言';
            break;
    }
    let sql = 'insert into blogArticle (title,content,intro,coverImg,author,datetime,tag,tagIndex) values (?,?,?,?,?,?,?,?)',
    dataVal = [data.title,data.content,data.intro,data.coverImg,data.author,issueTime,tagName,data.tag]
    
    if(data.tag == 2){
        sql = 'insert into blogMessage (content,dateTime) values (?,?)'
        dataVal = [data.intro,issueTime]
    }
    try{
        await db.query(sql,dataVal).then((res,err) => {
            ctx.body = {
                status: 200,
                msg: '添加成功',
            }
        })
    }catch(err){
       ctx.body = {
            status: 500,
            msg: 'Error:'+err.message,
        }
    }
})
router.get('/getMessageList', async (ctx, next) => {
    let sql = 'select * from blogMessage order by dateTime desc ',
    parms = [];
    await db.query(sql,parms).then(res => {
        // console.log(res);
        if(res.length == 0){
            ctx.body = {
                status:400,
                msg: "未查找到相关内容，请联系管理员后重试",
                data:[]
            }
        }else{
            ctx.body = {
                status:200,
                data: res,
            }
        }
    })
})
router.post('/reading', async (ctx, next) => {
    console.log(ctx.request.body)
    let num = Number(ctx.request.body.num) + 1
    let id = ctx.request.body.id
    try{
        await db.query(`update blogArticle set readingNum=? where id=?`,[num,id]).then((res,err) => {
            if (err) {
                throw err
            }
            if(res.changedRows == 1){
                console.log('有人阅读了')
                ctx.body = {
                    status:200
                }
            }
        })
    }catch(err){
       console.log('Error:'+err.message)
    }
})

router.post('/like', async (ctx, next) => {
    let num = Number(ctx.request.body.num) + 1
    let id = ctx.request.body.id
    try{
        await db.query(`update blogArticle set likeNum=? where id=?`,[num,id]).then((res,err) => {
            if (err) {
                throw err
            }
            if(res.changedRows == 1){
                console.log('有人点赞了')
                ctx.body = {
                    status:200
                }
            }
        })
    }catch(err){
       console.log('Error:'+err.message)
    }
})
router.post('/comment', async (ctx, next) => {
    let data = {
        articleId : ctx.request.body.articleId,
        comment: ctx.request.body.comment,
        email: ctx.request.body.email,
        uname: ctx.request.body.uname,
        dateTime: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
        ip: ctx.request.ip.split(':').pop()
    }
    let key = '4a9b608e59f69937704b20d9efa17d9a'

    let city = await new Promise((req,rej)=>{
        request({
            url:`https://restapi.amap.com/v3/ip?ip=${data.ip}&output=json&key=${key}`,
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
        return data['province'] + data['city']
    },err => {
        return err
    })
    console.log(city)
    try{
        let sql = 'insert into blogComment (articleId,uname,ip,city,dateTime,email,comment) values (?,?,?,?,?,?,?)',
        dataVal = [data.articleId,data.uname,data.ip,city,data.dateTime,data.email,data.comment]

        await db.query(sql,dataVal).then((res,err) => {
            if (err) {
                throw err
            }
            if(res.affectedRows == 1){
                console.log('有人评论了')
                ctx.body = {
                    status : 200,
                    msg : '评论成功'
                }
            }
        })
    }catch(err){
       console.log('Error:'+err.message)
    }
})
router.get('/comment', async (ctx, next) => {
    let id = ctx.request.query.id
    
    let sql = 'select city,comment,dateTime,uname from blogComment where articleId=? and status=1',
    parms = [id];
    await db.query(sql,parms).then(res => {
        // console.log(res);
        if(res.length == 0){
            ctx.body = {
                status:400,
                msg: "未查找到相关内容，请联系管理员后重试",
                data:[]
            }
        }else{
            ctx.body = {
                status:200,
                data: res,
            }
        }
    })    
})
router.get('/allComment', async (ctx, next) => {
    let currentPage = Number(ctx.request.query.currentPage),
        limit = Number(ctx.request.query.limit);
    
    let sql = 'select a.title,c.* from blogComment c left join blogArticle a on c.articleId=a.id ORDER BY c.id DESC LIMIT ?,?',
        sqlTotal = `SELECT count(*) AS 'total' FROM blogComment`,
        parms = [(currentPage-1)*limit,limit];
    let data = await db.query(sql,parms).then(res => {
        if(res.length == 0){
            return "未查找到相关内容，请联系管理员后重试"
        }else{
            return res
        }
    })   
    await db.query(sqlTotal,[]).then(res => {
        if(res.length == 0){
            ctx.body = {
                status:400,
                msg: "未查找到相关内容，请联系管理员后重试",
                data:[]
            }
        }else{
            ctx.body = {
                status:200,
                data: data,
                total:res[0].total
            }
        }
    })   
})
router.put('/changeStatus', async (ctx, next) => {
    let status = Number(ctx.request.body.status),
        id = Number(ctx.request.body.id);

    await db.query('UPDATE blogComment SET status=? WHERE id =?',[status,id]).then(res => {
        if(res.length == 0){
            ctx.body = {
                status:400,
                msg: '修改失败'
            }
        }else{
            ctx.body = {
                status:200,
                msg: '修改成功'
            }
        }
    })
});
router.delete('/delete', async (ctx, next) => {
    let ids = ''
    JSON.parse(ctx.request.query.ids).forEach((item) => {
      ids += item + ','
    });
    ids = ids.substring(0, ids.length - 1);
    await db.query('DELETE FROM blogComment WHERE id IN (?)',[ids]).then(res => {
        if(res.length == 0){
            ctx.body = {
                status:400,
                msg: '修改失败'
            }
        }else{
            ctx.body = {
                status:200,
                msg: '修改成功'
            }
        }
    })
  });
module.exports = router
