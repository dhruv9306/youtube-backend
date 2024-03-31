import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadoncloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser= asyncHandler( async(req,res)=>{
    const {username,email,fullname,password}= req.body;
    console.log("email: " + email);
    // if(fullname==""){
    //     throw new ApiError(400,"credentials required")
    // }

    if(
        [fullname,email,username,password].some((field)=> field?.trim === "")

    ){
        throw new ApiError(400,"field are required")

    }

    const existedUser= await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(400,"email id or username already exists")
    }

    const avatarlocalpath= req.files?.avatar[0]?.path;    
    const coverimagelocalpath = req.files?.coverimage[0]?.path; 


    if(!avatarlocalpath) throw new ApiError(400,"avatar field is required");


    const avatar= await uploadoncloudinary(avatarlocalpath)
 
    const coverimage= await uploadoncloudinary(coverimagelocalpath);


    if(!avatar) throw new ApiError(400,"avatar field is required");


    const user= await User.create({
        username,
        avatar: avatar.url,
        coverimage:coverimage?.url || "",
        email,
        password,
        username:username.toLowerCase(),


    })

    const createdUser= await User.findById(user._id).select(
        " -password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering a user");

    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registration done")
    )

})

export {registerUser,

}