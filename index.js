const express =require("express");
const bcrypt = require("bcrypt"); 
const {UserModel,TodoModel}=require("./db");
const jwt=require("jsonwebtoken");
const { default: mongoose, Error } = require("mongoose");
const JWT_SECRET="yappienoodles@qqqqqq";
const app = express();
const{z}=require("zod");

app.use(express.json());

app.post("/signup",async function(req,res){
    const requiredBody=z.object({
        email: z.string().min(3).max(100).email(),
        name: z.string().min(3).max(100),
        password: z.string().min(3).max(100).regex(/[A-Z]/).regex(/[a-z]/).regex(/[@#$%?!]/)

    })
    //const parsedData=requiredBody.parse(req.body);
    const parsedDataWithSucess = requiredBody.safeParse(req.body);
    if(!parsedDataWithSucess.success){
        res.json({
            message:"Incorrect Format",
            error:parsedDataWithSucess.error
        })
        return
    }
    const email = req.body.email;
      
    const password = req.body.password;
    const name = req.body.name; 
    let errorThrown=false;
    try{
    const hashedpassword=await bcrypt.hash(password,5);

    await UserModel.create({
        email:email,
        password:hashedpassword,
        username:name
    });
}catch(e){
    res.json({
        message:"user ald exists "
    })
    errorThrown=true;
}
    if(!errorThrown){
        res.json({
            message:"user logged in "
        })

    }

});



app.post("/signin",async function(req,res){
    const email = req.body.email;
    const password = req.body.password;
    const response = await UserModel.findOne({
        email:email,
    })
    console.log(response);
    if(!response){
        res.status(403).json({
            message:"user not in database"
        })
        return

    }
    if(response){
        const passwordMatch =await bcrypt.compare(password,response.password);
        if(passwordMatch){
        const token =jwt.sign({
            id:response._id.toString()
        },JWT_SECRET);
        res.json({
            token:token
            
        }
        )
    }
    else{
        res.status(403).json({
            message:"incorrect creds"
        }
        )
    }

}

});



app.post("/todo",auth,async function(req,res){
    const description = req.body.description;
    console.log(description)
    const done = req.body.done;
    const userId=req.userId;
    await TodoModel.create({
        userId,
        description,
        done
    });
    res.json({
        message:"todo created"
    })


});



app.post("/todos",auth,async function(req,res){
    const userId=req.userId;
    const todos = await TodoModel.find({
        userId
});
    res.json({
        todos
    })

});



function auth(req,res,next){
 const token = req.headers.token;
 const decodedData = jwt.verify(token,JWT_SECRET);  
 if(decodedData){
    req.userId=decodedData.id;
    next();
 } else{
    res.status(403).json({
        message:"incorrect creds"

    })



 }
}

app.listen(3000);
