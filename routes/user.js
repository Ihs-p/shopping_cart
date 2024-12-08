var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const userHelper = require("../helpers/user-helper");
const async = require('hbs/lib/async');

const verifyLogin = (req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user  = req.session.user
  let cartCount = null
  if(user){
    cartCount =await userHelper.getCartCount(user.UserID)
  }
  
  
  productHelper.getAllProducts().then((products)=>{

    res.render('user/view-products',{products,user,cartCount});
  })
});

router.get('/login',(req,res)=>{
  if(req.session.userLoggedIn){
    res.redirect('/')
  }
  else{
    res.render('user/login',{loginError:req.session.userLoggedError})
    req.session.userLoggedError = false
  }
  
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  
  userHelper.doSignup(req.body).then((response)=>{
    req.session.userLoggedIn = true
    req.session.user = response
    res.redirect('/login')
  })
})

router.post('/login',(req,res)=>{


  userHelper.doLogin(req.body).then((response)=>{
    
    if(response.status){
      req.session.userLoggedIn=true
      req.session.user = response.user
      res.redirect('/')
    }else{
    //let String = "invalid username or password"
      req.session.userLoggedError = true
      res.redirect('/login')
    }
  })
})

router.get("/logout",(req,res)=>{
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

router.get('/cart',verifyLogin,async (req,res)=>{
 // console.log("ggggg"+req.session.user.UserID)
  let totalAmount = await userHelper.getTotalCartAmount(req.session.user.UserID)
 // console.log(totalAmount)
  userHelper.getAllCarts(req.session.user.UserID).then((products)=>{
 // console.log("cartddddd:"+products[0].quantity)
    if(products.noCart){
      res.render('user/cart',{user:req.session.user,nocart:true})

    }else{
      
    res.render('user/cart',{user:req.session.user,products,totalAmount,cart:true})
    }
  })
  
  
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log("api call")
   userHelper.addToCart(req.params.id,req.session.user.UserID).then(()=>{
    res.json({status:true})
   })
})

router.post('/change-product-quantity', (req,res,next)=>{

  userHelper.changeProductQuantity(req.body).then(async(response)=>{
    
    res.json(response)
  })
})

router.get('/remove-cart/:id',(req,res)=>{
  userHelper.removeCart(req.params.id).then(()=>{
    res.redirect('/cart')
  })
})

router.get('/place-order/:id',async (req,res)=>{
  let totalAmount = await userHelper.getTotalCartAmount(req.params.id)
  res.render('user/place-order',{totalAmount,user:req.params.id})
})

router.post('/place-order',async (req,res)=>{
   // console.log(req.body);
    let products = await userHelper.getCartproductList(req.body.User) 
    let total    = await userHelper.getTotalCartAmount(req.body.User)
   // console.log("heeey")
     userHelper.placeOrder(req.body,products,total).then(()=>{
      res.json({status:true})
     })
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-success')
})

router.get('/orders',verifyLogin,async (req,res)=>{
  let orders = await userHelper.getAllOrders(req.session.user.UserID)
console.log(orders)
res.render('user/order',{user:req.session.user,orders})
})

router.get('/view-order-product/:id',async (req,res)=>{
let product = await userHelper.getOrderProduct(req.params.id)
console.log("product",product)
res.render('user/order-product',{user:req.session.user,product})
})

module.exports = router;
