import {v2 as cloudinary} from "cloudinary";

import fs from "fs";

  

          
cloudinary.config({ 
  cloud_name: 'dg2trymwz', 
  api_key: '219489217588864', 
  api_secret: 'rz4Iv6Lozv7ucYIWZu2uEnagZbA' 
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