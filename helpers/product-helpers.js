const { json } = require("body-parser");
var db = require("../config/connection");
var TABLES = require("../config/Tables");
const async = require("hbs/lib/async");
const { resolve } = require("express-hbs/lib/resolver");
const { reject } = require("bcrypt/promises");

module.exports = {
  addproduct: (product, imagename, callback) => {
    const product_detiels = {
      name: product.Name,
      color: product.Color,
      price: product.Price,
      image: imagename,
    };
    console.log(product_detiels);
    // values('"+name+"'"+","+"'"+color+"'"+","+"'"+price+"'"+")"
    var sql =
      "insert into " +
      TABLES.PRODUCT_TABLE +
      "(Name,Color,Price,Image) values (?,?,?,?) ";
    db.query(
      sql,
      [
        product_detiels.name,
        product_detiels.color,
        product_detiels.price,
        product_detiels.image,
      ],
      (err) => {
        if (!err) {
          callback();
          console.log("datas are inserted into database");
        } else {
          console.log(err);
        }
      }
    );
  },

  getAllProducts: () => {
    return new Promise((resolve, reject) => {
      let sql = "select * from " + TABLES.PRODUCT_TABLE;
      db.query(sql, (err, result) => {
        if (err) {
          throw err;
        } else {
          resolve(result);
        }
      });
    });
  },

  deleteProduct: (proId) => {
    return new Promise(async (resolve, reject) => {
      
      let sql = "SELECT Image FROM " + TABLES.PRODUCT_TABLE + " WHERE ID=?";
      await db.query(sql, proId, (err, result) => {
        if (!err) {
         let image = result[0].Image
         let sql = "DELETE FROM "+TABLES.PRODUCT_TABLE+" WHERE ID=?"
         db.query(sql,proId,(err,result)=>{
          resolve(image)
         })
        }
      });
    });
  },

  getProductDetiels: (proId) => {
    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM " + TABLES.PRODUCT_TABLE + " WHERE ID=?";
      db.query(sql, proId, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          resolve(result[0]);
        }
      });
    });
  },

  updateProduct: (proId, productDeteils, image) => {
    return new Promise((resolve, reject) => {
      if (image) {
        let sql =
          "UPDATE " +
          TABLES.PRODUCT_TABLE +
          " SET Name=?,Color=?,Price=?,Image=? WHERE ID=" +
          proId;
        db.query(
          sql,
          [
            productDeteils.Name,
            productDeteils.Color,
            productDeteils.Price,
            image.name,
          ],
          (err, result) => {
            if (err) {
              throw err;
            } else {
              resolve();
            }
          }
        );
      } else {
        let sql =
          "UPDATE " +
          TABLES.PRODUCT_TABLE +
          " SET Name=?,Color=?,Price=? WHERE ID=" +
          proId;
        db.query(
          sql,
          [productDeteils.Name, productDeteils.Color, productDeteils.Price],
          (err, result) => {
            if (err) {
              throw err;
            } else {
              resolve();
            }
          }
        );
      }
    });
  },

  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let sql = "SELECT * FROM " + TABLES.ORDER_TABLE;
      await db.query(sql, async (err, orderResult) => {
        if (!err && orderResult.length > 0) {
          for (let i = 0; i < orderResult.length; i++) {
            let sql =
              "SELECT Name FROM " +
              TABLES.PRODUCT_TABLE +
              " WHERE ID=" +
              orderResult[i].ProductID;
            await db.query(sql, (err, result) => {
              if(result.length>0){
                orderResult[i].productName = result[0].Name;
              } else{
                resolve()
              }
              
            });
          }
          console.log("asddddddddd", orderResult[0].productName);
          resolve(orderResult);
        }
        resolve();
      });
    });
  },

  getOrderproductDeteils: (proId)=>{
    return new Promise(async(resolve,reject)=>{
      let sql = "SELECT * FROM "+TABLES.PRODUCT_TABLE+" WHERE ID="+proId
      await db.query(sql,(err,result)=>{
        if(!err && result.length>0){
          resolve(result[0])
        } else{
          resolve()
        }
      })
    })
  }
};
