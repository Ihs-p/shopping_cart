var mysql = require("mysql");
module.exports=con=  mysql.createConnection(
    { 
       host:"localhost",
        user:"root",
        database: "Shopping Cart",
        password:""
    });
module.exports.connection = (done) => {
     
  con.connect((err)=>{
    if(err){ return done(err);}
    else{  return done()}
    
  });
};

