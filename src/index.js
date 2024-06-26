// require('dotenv').config({path:'E:\OneDrive - Chandigarh University\Desktop\Gandhi\coding\backend project 1\.env'})



// import mongoose from "mongoose";

// import {DB_NAME} from "./constants.js";

import dotenv from "dotenv"
import {app} from "./app.js"
import connectDb from "./db/index.js";

dotenv.config({
    path:'./env'
})



connectDb()
.then(()=>{
    app.listen(process.env.PORT || 5000,()=>{
        console.log(`server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("mongodb connnection failed",err);

})











// import express from "express";
// const app = express();

// ( async ()=>{
//     try{
//         await mongoose .connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        // app.on("error", (error)=>{
        //     console.log("err:",error);
        //     throw error;
        // })

//         app.listen(process.env.PORT,()=>{
//             console.log(`listening on port ${process.env.PORT}`);

//         })

//     }
//     catch (error){
//         console.log("error:",error);
//         throw error;
//     }

// }) ()