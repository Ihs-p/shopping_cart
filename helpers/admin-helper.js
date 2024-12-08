const { reject } = require("bcrypt/promises")
const  connection  = require("../config/connection")

module.exports={

    doLogin:(adminDetails)=>{
        return new Promise((resolve,reject)=>{ 
           


            let sql = "SELECT * FROM admin WHERE Name=?"
            connection.query(sql,adminDetails.Name,(err,result)=>{
                if(!err && result.length>0){
                   if(adminDetails.Email == result[0].Email){
                    if(adminDetails.Password == result[0].Password){
                        let response = {
                            status:true,
                            admin:result[0]
                            
                        }
                      resolve(response)
                    }
                   }else{   
                    resolve({status:false})
                   }
                }else{
                    resolve({status:false})
                   }
               
            })
        })
        

    }
}