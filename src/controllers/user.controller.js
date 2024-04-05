import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadoncloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { response } from "express"
import mongoose from "mongoose";
import jwt from "jsonwebtoken"

const generateaccessandrefreshtoken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken
        const refreshToken = user.generateRefreshToken

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }



    } catch (error) {
        throw new ApiError(500, "something is wrong while generating tokens")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;
    console.log("email: " + email);
    if (fullname == "") {
        throw new ApiError(400, "credentials required")
    }

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")

    ) {
        throw new ApiError(400, "field are required")

    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(400, "email id or username already exists")
    }
    // console.log(req.files);

    const avatarlocalpath = req.files?.avatar[0]?.path;
    const coverimagelocalpath = req.files?.coverimage[0]?.path;


    if (!avatarlocalpath) throw new ApiError(400, "avatar field is required");


    const avatar = await uploadoncloudinary(avatarlocalpath)

    const coverimage = await uploadoncloudinary(coverimagelocalpath);


    if (!avatar) throw new ApiError(400, "avatar field is required");


    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase()


    })

    const createdUser = await User.findById(user._id).select(
        " -password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering a user");

    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registration done")
    )

})



const loginuser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token generation
    //send these in cookies (secure)

    const { email, username, password } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) throw new ApiError(404, "user not found")

    const ispasswordvalid = await user.isPasswordCorrect(password)

    if (!ispasswordvalid) throw new ApiError(401, "invalid password")


    const { accessToken, refreshToken } = await generateaccessandrefreshtoken(user._id)


    const loginuser = await User.findById(user._id).select("-password -refreshToken")


    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loginuser, accessToken, refreshToken
                },
                "user logged in successfully"
            )
        )


})


const logoutuser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }

        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            refreshAccessToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)


        if (!user) {
            throw new ApiError(401, "invalid user refresh token")

        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is used or expired")

        }

        const options = {
            httpOnly: true,
            secure: true,

        }

        const { accessToken, newRefreshToken } = await generateaccessandrefreshtoken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "access token resfreshed successfully"

                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }

})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body

    const user= await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"old password is incorrect")
    }

    user.password = newPassword

    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password updated successfully"))
})


const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user,"current user fetched successfully"))
})

const updateAccountDetails= asyncHandler(async(req,res)=>{
    const{fullname,email}   = req.body

    if(!(fullname || email)){
        throw new ApiError(400,"both fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email,

            }

        },
        {
            new:true
        }
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200,user,"account details updated successfully"))
    
})

const updateAvatar = asyncHandler(async(req,res)=>{

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    const avatar = await uploadoncloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"error while uploading avatr")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"avatar is uploaded successfully")
    )
})


const updateCoverImage = asyncHandler(async(req,res)=>{

    const coverimageLocalPath = req.file?.path

    if(!coverimageLocalPath){
        throw new ApiError(400,"cover image file is required")
    }

    const coverimage = await uploadoncloudinary(coverimageLocalPath)

    if(!coverimage.url){
        throw new ApiError(400,"error while uploading cover image")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage:coverimage.url
            }
        },
        {new:true}
    ).select("-password")


    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"coverimage is uploaded successfully")
    )


})


const getUSerChannelProfile = asyncHandler(async(req, res) =>{
    const {username}= req.params

    if(!username){
        new ApiError(400,"username is requires")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$usbscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id,
                        "$subscribers.subscriber"]},

                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                usename:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverimage:1,
                email:1,


            }

        }

    ])

    console.log(channel)

    if(!channel?.length) {
        throw new ApiError(404,"channel does not exist")

    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully   ")
    )
})

export {
    registerUser, 
    loginuser, 
    logoutuser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUSerChannelProfile

}

