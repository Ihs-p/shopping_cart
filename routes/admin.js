var express = require("express");
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
const { runOnChangeOnly } = require("nodemon/lib/config/defaults");
const { route } = require("./user");
const adminHelper = require("../helpers/admin-helper");
const async = require("hbs/lib/async");
const userHelper = require("../helpers/user-helper");
const fs = require('node:fs/promises')

const verifyLogin = (req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else{
    res.redirect('/admin/login')
  }
}

/* GET users listing. */


router.get("/",verifyLogin, function (req, res) {
  productHelper.getAllProducts().then((products) => {
    res.render("admin/view-products", { admin: true, products });
  });
});

router.get('/login',(req,res)=>{
  if(req.session.adminLoggedIn){
    res.render('/admin')
  }else{
    console.log(req.session.adminLoggedError)
    res.render('admin/login')
    req.session.adminLoggedError = false
   
  }
  
 
})

router.post('/login',(req,res)=>{
  adminHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect("/admin")
    }
    req.session.adminLoggedError = true
    res.render('admin/login',{loginError:req.session.adminLoggedError})
  })
})

router.get("/add-product",verifyLogin, (req, res, next) => {
  res.render("admin/add-product", { admin: true });
});

router.post("/add-product", (req, res) => {
  console.log("heey datas are here");
  var imageName = req.files.Image.name;
  imageName = imageName.split(" ").join("");
  productHelper.addproduct(req.body, imageName, () => {
    var image = req.files.Image;

    image.mv("./public/images/product-images/" + imageName, (err) => {
      if (!err) {
        res.redirect("/admin");
        console.log("image saved");
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/delete-product/:id",verifyLogin, (req, res) => {
  let proID = req.params.id;
  productHelper.deleteProduct(proID).then((image) => {
    console.log(image)
     fs.unlink("./public/images/product-images/"+image,(err)=>{
      if(!err){
        res.redirect("/admin");
      console.log("image deleted successfully")
      } 
      console.log("qwerqwer",werr)

     })
    
  });
});

router.get("/edit-product/:id",verifyLogin, async (req, res) => {
  let product = await productHelper.getProductDetiels(req.params.id);
  console.log(product);
  res.render("admin/edit-product", { product });
});

router.post("/edit-product/:id", (req, res) => {
  productHelper
    .updateProduct(req.params.id, req.body, req.files.Image)
    .then(() => {
      res.redirect("/admin");
      if (req.files.Image) {
        var image = req.files.Image;

        image.mv("./public/images/product-images/" + image.name);
      }
    });
});

router.get('/logout',(req,res)=>{
  req.session.admin = null
  req.session.adminLoggedIn = 
  res.redirect('/')
})

router.get('/orders',verifyLogin,async (req,res)=>{
    let orders =await productHelper.getAllOrders()
    console.log(orders)
    
    res.render('admin/orders',{admin:req.session.admin,orders})
})

router.get('/view-order-product/:id',async(req,res)=>{
let product = await productHelper.getOrderproductDeteils(req.params.id)

  res.render('admin/view-order-product',{admin:req.session.admin,product})


})

router.get('/users',verifyLogin,async (req,res)=>{
 let users = await userHelper.getAllUsers()
  if(!users.noUsers){
    res.render('admin/users',{admin:req.session.admin,users:users.allUsers})
  }

  
})

module.exports = router;
