const router = require('koa-router')();
const fs = require('fs');

router.prefix('/upload')

// 文件上传
router.post('/', async (ctx, next) => {
    const file = ctx.request.files
    const originUrl = ctx.request.origin
    const fileName = file[Object.keys(file)[0]].path.split('public/').pop()
    return ctx.body = {
        msg: '上传成功',
        status:200,
        url: `${originUrl}/${fileName}`
    };
})


module.exports = router