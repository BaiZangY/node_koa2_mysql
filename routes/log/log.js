const router = require('koa-router')()
const db = require('../../sql/db')
const moment = require('moment')
const TreeCreateFast = require("../../libs/tree")
// 路由前缀
router.prefix('/log')

router.post('/login', async (ctx, next) => {
    let username = ctx.request.body.username,
        password = ctx.request.body.password,
        id = 0,
        time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    try{
        let status = await db.query(`SELECT u.*, ur.role_id FROM user as u LEFT JOIN blogUser_Role as ur ON u.id = ur.user_id WHERE username=?`,[username]).then((res,err) => {
            if (err) {
                throw err
            }
            let user = res[0];
            if (user != null || user != undefined) {
                if (user.password == password) {
                    ctx.body = {
                        type: 'ok',
                        msg: '登录成功',
                        username: user.user,
                        id: user.role_id
                    }
                    id = user.id
                    return true
                }else{
                    ctx.body = {
                        type: 'fild',
                        msg: '密码错误'
                    }
                    return false
                }
            } else {
                ctx.body = {
                    type: 'fild',
                    msg: '暂无用户'
                }
                return false
            }
        })
        status
        ? await db.query(`UPDATE user SET logTime = ? WHERE id=?`,[time,id]).then((res,err) => {
            if (err) {
                throw err
            }
        })
        : console.log("登录失败，请重试")
    }catch(err){
       console.log('Error:'+err.message)
    }
})
// 获取登录角色菜单
router.get('/getUser_menu', async (ctx, next) => {
    let role_id = ctx.request.query.id;


    let sql = `SELECT bm.*,bt.p_id FROM blogMenuList AS bm 
    LEFT JOIN blogMenu_tree AS bt ON bm.id=bt.menu_id 
    LEFT JOIN blogRole_Menu_checkend AS brm ON bt.menu_id=brm.menu_id
    WHERE brm.role_id = ?`,
    parms = [role_id];

    let menuList = await db.query(sql,parms).then(res => {
        // console.log(res);
        res.length == 0 
        ? ctx.body = {
                status:400,
                msg: "未查找到相关菜单，请联系管理员后重试",
                data:[]
            }
        : ''
        return res
    })

    let menuTree = new TreeCreateFast(function(item) {
        for (let key of Object.keys(item)) {
          this[key] = item[key]
        }
      }, { fId: 'p_id', id: 'id', rootId: '0' })

    menuTree.create(menuList, true)
    // console.log(menuTree)
    ctx.body = {
        status:200,
        data:menuTree.treeData
    }
})
// 获取用户信息
router.get('/getAllInfo', async (ctx, next) => {
    let sql = 'SELECT u.id,u.username,u.user,u.phoneNumber,u.email, r.name FROM user u LEFT JOIN blogUser_Role ur ON u.id = ur.user_id LEFT JOIN blogRole r ON r.id = ur.role_id',
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
// 添加用户
router.post('/insertUser', async (ctx, next) => {
    let username = ctx.request.body.username,
        password = ctx.request.body.password,
        user = ctx.request.body.user,
        email = ctx.request.body.email,
        phoneNumber = ctx.request.body.phoneNumber;
    try{

        let sql = "INSERT into user (username,user,password,email,phoneNumber) values (?,?,?,?,?)",
            data = [username,user,password,email,phoneNumber];

        let isExist = await db.query(`SELECT * FROM user WHERE username="${username}"`,[]).then((res,err) => {
            if (err) {
                throw err
            }
            let check = res[0] ? true : false;
            return check
        })

        isExist
        ? ctx.body = {
            status: 500,
            type: 'fild',
            msg: '该账号已存在，请重新添加登录账号'
        } 
        : await db.query(sql,data).then((res,err) => {
            if (err) {
                throw err
            }
            ctx.body = {
                status: 200,
                msg: '添加成功',
            }
        })
    }catch(err){
       console.log('Error:'+err.message)
    }
})

// 获取菜单信息
router.get('/getAllMenuInfo', async (ctx, next) => {
    let sql = 'SELECT bm.*,bt.p_id FROM blogMenuList AS bm JOIN blogMenu_tree AS bt ON bm.id=bt.menu_id',
        parms = [];
    let menuList = await db.query(sql,parms).then(res => {
        // console.log(res);
        res.length == 0 
        ? ctx.body = {
                status:400,
                msg: "未查找到相关菜单，请联系管理员后重试",
                data:[]
            }
        : ''
        return res
    })

    let menuTree = new TreeCreateFast(function(item) {
        for (let key of Object.keys(item)) {
          this[key] = item[key]
        }
      }, { fId: 'p_id', id: 'id', rootId: '0' })

    menuTree.create(menuList, true)
    console.log(menuTree)
    ctx.body = {
        status:200,
        data:menuTree.treeData
    }
})

// 添加菜单
router.post('/insertMenu', async (ctx, next) => {
    let name = ctx.request.body.name,
        displayName = ctx.request.body.displayName,
        url = ctx.request.body.url,
        icon = ctx.request.body.icon,
        pId = ctx.request.body.pId;

    try{
        let sql = "INSERT into blogMenuList (name,displayName,url,icon,level) values (?,?,?,?,?)",
            data = [name, displayName, url, icon, pId == 0 ? 1 : 2];

        let menuId = await db.query(sql,data).then((res,err) => {
            if (err) {
                throw err
            }
            return res.insertId
        })
       
        let sql_insert = "INSERT into blogMenu_tree (p_id,menu_id) values (?,?)",
            data_insert = [pId, menuId];

        let menu_tree = await db.query(sql_insert,data_insert).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
       
        menu_tree
        ? ctx.body = {
            status: 200,
            msg: '添加成功',
        } : ''
    }catch(err){
       console.log('Error:'+err.message)
    }
})

// 删除菜单
router.post('/deleteMenu', async (ctx, next) => {
    let id = ctx.request.body.id;

    try{
        let sql = "DELETE FROM blogMenuList WHERE id=?",
            sql_P_tree = "DELETE FROM blogMenu_tree WHERE p_id=?",
            sql_tree = "DELETE FROM blogMenu_tree WHERE menu_id=?",
            sql_del = "DELETE FROM blogRole_Menu WHERE menu_id=?",
            sql_allDel = "DELETE FROM blogRole_Menu_checkend WHERE menu_id=?",
            data = [id];
            
        let deleteStatus = await db.query(sql,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        let deleteStatus_pt = await db.query(sql_P_tree,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        let deleteStatus_t = await db.query(sql_tree,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        let deleteStatus_rm = await db.query(sql_del,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        let deleteStatus_rme = await db.query(sql_allDel,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        
        deleteStatus && deleteStatus_pt && deleteStatus_t && deleteStatus_rm && deleteStatus_rme
        ? ctx.body = {
            status: 200,
            msg: '删除成功',
        }
        : ctx.body = {
            status: 500,
            msg: '删除错误，请联系管理员',
        }
    }catch(err){
       console.log('Error:'+err.message)
    }
})

// 获取所有角色信息
router.get('/getAllRoleInfo', async (ctx, next) => {
    let sql = 'SELECT * FROM blogRole',
        parms = [];
    let roleList = await db.query(sql,parms).then(res => {
        // console.log(res);
        res.length == 0 
        ? ctx.body = {
                status:400,
                msg: "未查找到相关菜单，请联系管理员后重试",
                data:[]
            }
        : ''
        return res
    })

    ctx.body = {
        status:200,
        data:roleList
    }
})

// 获取单角色菜单
router.get('/getRole_Menu', async (ctx, next) => {
    let id = ctx.request.query.id;
    // console.log(id)
    let sql = 'SELECT menu_id FROM blogRole_Menu WHERE role_id=?',
        parms = [id];

    let checkedMenuList = await db.query(sql,parms).then(res => {
        // console.log(res);
        res.length == 0 
        ? ctx.body = {
                status:400,
                msg: "未查找到相关菜单，请联系管理员后重试",
                data:[]
            }
        : ''
        return res
    })

    ctx.body = {
        status:200,
        data:checkedMenuList
    }
})

// 添加角色
router.post('/insertRole', async (ctx, next) => {
    let name = ctx.request.body.name,
        remark = ctx.request.body.remark,
        checkList = ctx.request.body.checkList.split(","),
        checkAllList = ctx.request.body.checkAllList.split(",")
    try{
        let sql = "INSERT into blogRole (name,remark,status) values (?,?,?)",
            data = [name, remark,'1'];

        let role_id = await db.query(sql,data).then((res,err) => {
            if (err) {
                throw err
            }
            return res.insertId
        })

        let sql_insert = "INSERT into blogRole_Menu (menu_id,role_id) values ?",
            data_insert = [];
            checkList.forEach(item => {
                data_insert.push([item,role_id])
            });
        let sql_allInsert = "INSERT into blogRole_Menu_checkend (menu_id,role_id) values ?",
            data_allInsert = [];
            checkAllList.forEach(item => {
                data_allInsert.push([item,role_id])
            });

        let role_menu = await db.query(sql_insert,[data_insert]).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })

        let role_menu_checkend = await db.query(sql_allInsert,[data_allInsert]).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })

        role_menu && role_menu_checkend
        ? ctx.body = {
            status: 200,
            msg: '添加成功',
        } : ''
    }catch(err){
       console.log('Error:'+err.message)
    }
})

// 编辑角色
router.post('/editRole', async (ctx, next) => {
    let name = ctx.request.body.name,
        remark = ctx.request.body.remark,
        id = ctx.request.body.id,
        status = ctx.request.body.status,
        checkList = ctx.request.body.checkList.split(","),
        checkAllList = ctx.request.body.checkAllList.split(",");

    try{
        let sql = "UPDATE blogRole SET name=?,remark=?,status=? WHERE id=?",
            sql_del = "DELETE FROM blogRole_Menu WHERE role_id=?",
            data = [name, remark,status,id]
            data_del = [id];

        let editStatus = await db.query(sql,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        
        let delStatus = await db.query(sql_del,data_del).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        let sql_insert = "INSERT into blogRole_Menu (menu_id,role_id) values ?",
            data_insert = [];
            checkList.forEach(item => {
                data_insert.push([item,id])
            });

        let insertStatus = await db.query(sql_insert,[data_insert]).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        }) 

        let sql_allInsert = "INSERT into blogRole_Menu_checkend (menu_id,role_id) values ?",
        data_allInsert = [];
        checkAllList.forEach(item => {
            data_allInsert.push([item,role_id])
        });
        let insertAllStatus = await db.query(sql_allInsert,[data_allInsert]).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        }) 
    
        editStatus && delStatus && insertStatus && insertAllStatus
        ? ctx.body = {
            status: 200,
            msg: '修改成功',
        }
        : ctx.body = {
            status: 500,
            msg: '修改失败',
        }
    }catch(err){
       console.log('Error:'+err.message)
    }
})

// 删除角色
router.post('/deleteRole', async (ctx, next) => {
    let id = ctx.request.body.id;
    try{
        let sql = "DELETE FROM blogRole WHERE id=?",
            sql_del = "DELETE FROM blogRole_Menu WHERE role_id=?",
            sql_allDel = "DELETE FROM blogRole_Menu_checkend WHERE role_id=?",
            sql_del_role = "DELETE FROM blogUser_Role WHERE role_id=?",
            data = [id]

        let editStatus = await db.query(sql,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })

        let delStatus = await db.query(sql_del,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        let delAllStatus = await db.query(sql_allDel,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        let delRoleStatus = await db.query(sql_del_role,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })
        editStatus && delStatus && delAllStatus && delRoleStatus
        ? ctx.body = {
            status: 200,
            msg: '删除成功',
        }
        : ctx.body = {
            status: 500,
            msg: '删除失败',
        }
    }catch(err){
       console.log('Error:'+err.message)
    }
})

// 修改用户角色
router.post('/editUser_Role', async (ctx, next) => {
    let u_id = ctx.request.body.u_id,
        r_id = ctx.request.body.r_id;
        console.log(u_id,r_id)
    try{
        let sql_del = "DELETE FROM blogUser_Role WHERE user_id=?",
            sql = "INSERT INTO blogUser_Role (user_id,role_id) VALUE (?,?)",
            data_del = [u_id],
            data = [u_id,r_id];

        let delStatus = await db.query(sql_del,data_del).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })

        let editStatus = await db.query(sql,data).then((res,err) => {
            if (err) {
                throw err
            }
            return true
        })

        editStatus && delStatus
        ? ctx.body = {
            status: 200,
            msg: '修改成功',
        }
        : ctx.body = {
            status: 500,
            msg: '修改失败',
        }
    }catch(err){
       console.log('Error:'+err.message)
    }
})

module.exports = router
