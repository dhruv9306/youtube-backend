import {vs as cloudinary} from "cloudinary";

import fs from "fs";

  
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY, 

  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadoncloudinary=async(localfilepath)=>{
    try {
        if(!localfilepath){
            return null;
        }
        const response= await cloudinary.uploader.upload(localfilepath,{
            resource_type:'auto'
        })
        console.log("successfully uploaded",response.url);
        return response;

    } catch (error) {
        fs.unlink(localfilepath) //remove the locally saved temporary file as the upload operation got failed
        return null;    
    }
}

export {uploadoncloudinary}