const { resolve } = require("express-hbs/lib/resolver");
const db = require("../config/connection");
var TABLES = require("../config/Tables");
const bcrypt = require("bcrypt");
const { reject, promise } = require("bcrypt/promises");
const async = require("hbs/lib/async");
module.exports = {
  doSignup: (userdata) => {
    return new Promise(async (resolve, reject) => {
      userdata.Password = await bcrypt.hash(userdata.Password, 10);

      let sql =
        "insert into " +
        TABLES.USER_TABLE +
        "(Name,Email,Password) values(?,?,?)";

      db.query(
        sql,
        [userdata.Name, userdata.Email, userdata.Password],
        (err, result) => {
          if (err) {
            throw err;
          } else {
            resolve(result);
          }
        }
      );
    });
  },

  doLogin: (userdata) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = true;
      let response = {};
      let sql = "select * from " + TABLES.USER_TABLE + " where Email=?";
      await db.query(sql, userdata.Email, (err, result) => {
        if (err) {
          throw err;
        } else {
          if (result.length > 0) {
            bcrypt
              .compare(userdata.Password, result[0].Password)
              .then((status) => {
                if (status) {
                  response.user = result[0];
                  response.status = true;
                  resolve(response);
                } else {
                  resolve({ status: false });
                }
              });
          } else {
            resolve({ status: false });
          }
        }
      });
    });
  },

  addToCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      let cartUser;
      let sql = "SELECT * FROM " + TABLES.CART_TABLE + " WHERE UserID=?";
      await db.query(sql, userId, (err, result) => {
        if (result.length > 0) {
          cartUser = result;

          if (cartUser) {
            for (let i = 0; i < cartUser.length; i++) {
              if (proId == cartUser[i].ProductID) {
                var cartUserProduct = cartUser[i].ProductID;
                var cartId = cartUser[i].CartID;
                var cartQuantity = cartUser[i].Quantity;

                break;
              }
            }
            if (cartUserProduct) {
              cartQuantity += 1;
              let sql =
                "UPDATE " +
                TABLES.CART_TABLE +
                " SET Quantity=" +
                cartQuantity +
                " WHERE CartID=" +
                cartId;
              db.query(sql, (err, result) => {
                if (!err) {
                  resolve();
                }
              });
            } else {
              let sql =
                "INSERT INTO " +
                TABLES.CART_TABLE +
                "(UserID,ProductID,Quantity) values(?,?,1)";
              db.query(sql, [userId, proId], (err, result) => {
                if (!err) {
                  resolve();
                }
              });
            }
          }
        } else {
          let sql =
            "INSERT INTO " +
            TABLES.CART_TABLE +
            "(UserID,ProductID,Quantity) values(?,?,1)";
          db.query(sql, [userId, proId], (err, result) => {
            if (!err) {
              resolve();
            }
          });
        }
      });
    });
  },

  getAllCarts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartProducts = [];
      let sql =
        "SELECT * FROM " + TABLES.CART_TABLE + " WHERE UserID=" + userId;
      await db.query(sql, async (err, Firstresult) => {
        if (Firstresult.length > 0) {
          for (let i = 0; i < Firstresult.length; i++) {
            let sql =
              "SELECT * FROM " +
              TABLES.PRODUCT_TABLE +
              " WHERE ID=" +
              Firstresult[i].ProductID;
            await db.query(sql, (err, result) => {
              if (!err) {
                cartProducts[i] = result[0];
                cartProducts[i].Quantity = Firstresult[i].Quantity;
                cartProducts[i].CartID = Firstresult[i].CartID;
                cartProducts[i].ProId = Firstresult[i].ProductID;
                console.log(cartProducts);
              }
            });
          }

          resolve(cartProducts);
        } else {
          resolve({ noCart: true });
        }
      });
    });
  },
  getCartCount: (UserID) => {
    return new Promise(async (resolve, reject) => {
      let cartCount = 0;
      let sql =
        "SELECT * FROM " + TABLES.CART_TABLE + " WHERE UserID=" + UserID;
      await db.query(sql, (err, result) => {
        if (result.length > 0) {
          for (let i = 0; i < result.length; i++) {
            cartCount += result[i].Quantity;
          }
          resolve(cartCount);
        } else {
          resolve(cartCount);
        }
      });
    });
  },

  changeProductQuantity: (details) => {
    return new Promise((resolve, reject) => {
      if (details.Count == -1 && details.Quantity == 1) {
        let sql =
          "DELETE FROM " +
          TABLES.CART_TABLE +
          " WHERE CartID=" +
          details.CartID;
        db.query(sql, (err, result) => {
          if (!err) {
            console.log("deleted cart");
            resolve({ removeCart: true });
          }
        });
      } else {
        let sql =
          "UPDATE " +
          TABLES.CART_TABLE +
          " SET Quantity=Quantity+" +
          details.Count +
          " WHERE CartID=" +
          details.CartID;
        db.query(sql, (err, result) => {
          if (!err) resolve({ status: true });
          console.log("asdf");
        });
      }
    });
  },

  getTotalCartAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let totalAmount = 0;
      let sql =
        "SELECT * FROM " + TABLES.CART_TABLE + " WHERE UserID=" + userId;
      await db.query(sql, async (err, Firstresult) => {
        if (Firstresult.length > 0) {
          for (let i = 0; i < Firstresult.length; i++) {
            let sql =
              "SELECT * FROM " +
              TABLES.PRODUCT_TABLE +
              " WHERE ID=" +
              Firstresult[i].ProductID;
            await db.query(sql, (err, result) => {
              if (!err) {
                let total = Firstresult[i].Quantity * result[0].Price;

                totalAmount += total;

                resolve(totalAmount);
                console.log(i);
              }
            });
          }
        }
      });
    });
  },

  removeCart: (cartId) => {
    return new Promise((resolve, reject) => {
      let sql = "DELETE FROM " + TABLES.CART_TABLE + " WHERE CartID=" + cartId;
      db.query(sql, (err) => {
        if (!err) resolve();
      });
    });
  },

  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(order);
      console.log("    " + total);
      let Status = order["payment-method"] == "COD" ? "placed" : "pending";
      let date = new Date();
      console.log(date);
      for (let i = 0; i < products.length; i++) {
        let sql =
          "INSERT INTO " +
          TABLES.ORDER_TABLE +
          "(Name,UserID,Address,Pincode,Mobile,PaymentMethod,ProductID,Quantity,TotalAmount,Date,Status) values (?,?,?,?,?,?," +
          products[i].ProductID +
          "," +
          products[i].Quantity +
          "," +
          total +
          "," +
          "?,?)";

        db.query(
          sql,
          [
            order.Name,
            order.User,
            order.Address,
            order.Pincode,
            order.Mobile,
            order["payment-method"],
            date,
            Status,
          ],
          (err, result) => {
            if (err) {
              throw err;
            }
            console.log("inserted order");
          }
        );
      }
      resolve();
      db.query(
        "DELETE FROM " + TABLES.CART_TABLE + " WHERE UserID=" + order.User
      );
    });
  },

  getCartproductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let sql =
        "SELECT ProductID,Quantity FROM " +
        TABLES.CART_TABLE +
        " WHERE UserID=" +
        userId;
      await db.query(sql, (err, result) => {
        if (err) {
          console.log("asdfsadfsadsaf" + err);
        }
        resolve(result);
      });
    });
  },

  getAllOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let sql =
        "SELECT * FROM " + TABLES.ORDER_TABLE + " WHERE UserID=" + userId;
      await db.query(sql, (err, result) => {
        if (!err) resolve(result);
      });
    });
  },

  getOrderProduct: (orderId) => {
    return new Promise((resolve, reject) => {
      let sql =
        "SELECT *FROM " + TABLES.ORDER_TABLE + " WHERE OrderID=" + orderId;
      db.query(sql, (err, orderResult) => {
        let sql =
          "SELECT Name,Price,Image FROM " +
          TABLES.PRODUCT_TABLE +
          " WHERE ID=" +
          orderResult[0].ProductID;
        db.query(sql, (err, result) => {
          result[0].Quantity = orderResult[0].Quantity;
          resolve(result[0]);
        });
      });
    });
  },

  getAllUsers:()=>{
    return new Promise((resolve,reject)=>{
      let users={}
      let sql = "SELECT * FROM "+TABLES.USER_TABLE
      db.query(sql,(err,result)=>{
        if(result.length>0){
          users.allUsers = result
          users.noUsers  = false

          resolve(users)
        }
        resolve({noUsers:true})
      })
    })
  }
};
