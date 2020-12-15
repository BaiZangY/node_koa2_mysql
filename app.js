const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const koaBody = require('koa-body');
const uploadConfig = require('./routes/upload/upload.config')


// const sslify = require('koa-sslify').default // http强制转换https

// app.use(sslify())

// 处理跨域问题
const cors = require('koa2-cors')
app.use(cors({
  origin:"*",
  exposeHeaders:['WWW-Authenticate','Server-Authorization'],
  maxAge:5,
  credentials:true,
  allowMethods:['GET','POST','DELETE','PUT'],
  allowHeaders:['Content-type','Authorization','Accept']
}))


// 文件上传限制
app.use(koaBody({
  multipart: true,
  formidable: {
      uploadDir:'public/uploadFile',
      keepExtensions: true,
      maxFileSize: 2000*1024*1024,
      onFileBegin: (name, file) => {
        // 最终要保存到的文件夹目录
        const dirName = uploadConfig.getUploadDirName();
        const dir = `public/uploadFile/${dirName}`;
        // 检查文件夹是否存在如果不存在则新建文件夹
        uploadConfig.checkDirExist(dir);
        // 获取文件名称
        const fileName = uploadConfig.getUploadFileName(file.name);
        // 重新覆盖 file.path 属性
        file.path = `${dir}/${fileName}`;
      },
      onError:(err)=>{
        console.log(err);
      }
  }
}))
// routes
const index = require('./routes/index')
const upload = require('./routes/upload/upload')
const article = require('./routes/article/article')
const agency = require('./routes/agency/agency')
const login = require('./routes/log/log')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(upload.routes(), upload.allowedMethods())
app.use(article.routes(), article.allowedMethods())
app.use(agency.routes(), agency.allowedMethods())
app.use(login.routes(), login.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
