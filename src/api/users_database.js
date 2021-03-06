var express = require('express');
var router = express.Router();
var utility = require('./utility_functions')
var users = require('./mongo_connect')
var user_db = users.users_db;
var middleware = require('./middleware/verify_user')

router.get("/", function(req, res){
      user_db.find({},{'_id':0, '__v':0}).exec(function(err, response){
        if(err) throw err;
        res.status(200);
        res.json(response);
       })
    
});

router.get("/organizations", function(req, res){
    user_db.find({},{'organization':1, 'organization_image':1,'_id':0}).exec(function(err, response){
      if(err) throw err;
      res.status(200);
      res.json(response);
     })
  
});

router.get("/:type/:value", function(req, res){
    if(req.params.type!="user_id"){
        res.status(400);
        res.json({message: "Bad Request", value:req.params.type});
    }
    else{
        var type = req.params.type;
        var value = req.params.value;
        
        user_db.find({[type]:value},{'_id':0,'__v':0},function(err, response){
            if(err)
                    res.json({message: "Bad Request", value:req.params.type});
            else{
                res.status(200);
                res.json(response);
            }
        });
    }
});


router.post("/", middleware.verify, function(req, res){
	
    if(!req.body.user_id || !req.body.user_fullname){
        res.status(400);
        res.json({message: "Bad Request"});
    }
    else{
        user_name_recieved = req.body.user_id;

        var newUser = new user_db({
            user_id: req.body.user_id,
            user_name: req.body.user_name || '',
            user_fullname: req.body.user_fullname,          
            created_on: utility.current_date(),
            user_image: req.body.user_image || '',
            user_bio: req.body.bio|| '',
            isadmin:req.body.isadmin||0,
            organization: req.body.organization||'',
            organization_image: req.body.organization_image||''
          });

        user_db.find({["user_id"]:user_name_recieved},{'_id':0,'__v':0},function(err, response){
            if(err){
                res.status(500);
                res.response({Message:"Database Error"});
            }
            else{
                if(!response.length){
                    newUser.save(function(err, insert_result){
                        if(err)
                            res.json({message: "Database error", type: err});
                        else{
                            res.status(201);
                            res.json({ Message: "User Registered Successfully",insert_result});
                        }
                    });
                }
                else{
                    res.status(200);
                    res.json({Message:"User already exists", response});
                }
            }
        });
    }   
});

router.put("/", middleware.verify, function(req, res){

    if(!req.body.user_id || !req.body.organization){

        res.status(400);
        res.json({message: "Bad Request"});
    }
    else{
        user_id_recieved = req.body.user_id;

        user_db.find({["user_id"]:user_id_recieved}, function(err, response){
            if(err){
               res.json({message: "Database error", type: err});
            }
            else{
                if(!response.length){
                    res.status(404);
                    res.json({Message:"User not Found"});
                }
                else{
                    var update_values = {
                        organization: req.body.organization,
                        organization_image: req.body.organization_image ||''
                      };

                      user_db.findOneAndUpdate({"user_id":user_id_recieved},{$set:update_values},{new: true}).exec(function(err,updated_value){
                        if(err){
                            res.status(500);
                            res.json({message: "Internal Server Error", type:err});
                        }
                        else{
                            res.status(200);
                            res.json({Status:"Success",Details: updated_value});
                        }
                      });
                }   
            }
         });
    }   
});



module.exports = router;