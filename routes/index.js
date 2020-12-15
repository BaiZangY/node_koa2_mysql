const router = require('koa-router')()
const db = require('../sql/db')
const tk = require('../token/token')
const serect = 'withxy'
// 路由前缀
// router.prefix('/users')

router.get('/', async (ctx, next) => {
  await db.query('select * from user').then(res => {
    console.log(res);
    let token = tk.setToken({user:res[0].username,id:res[0].id})
    ctx.body = {
      code:1,
      status:200,
      msg:'sucess',
      data: res,
      token:token
    }
  })
})

router.get('/string', async (ctx, next) => {
  // console.log(ctx.request.header.authorization)
  let token = ctx.request.header.authorization;
  ctx.body = tk.getToken(token,serect)
})

module.exports = router
