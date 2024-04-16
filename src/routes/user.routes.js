import { Router } from "express"
import { 
    changeCurrentPassword, 
    registerUser, 
    loginuser, 
    logoutuser, 
    refreshAccessToken, 
    getCurrentUser, 
    updateAccountDetails, 
    updateAvatar, 
    updateCoverImage, 
    getUSerChannelProfile, 
    getWatchHistory } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 2

        },
        {
            name: "coverimage",
            maxCount: 2

        }
    ]),
    registerUser
)


router.route("/login").post(loginuser)

router.route("/logout").post(verifyJWT, logoutuser)

router.route("/refreshtoken").post(refreshAccessToken)
router.route("change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)
router.route("update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("/coverimage"), updateCoverImage)
router.route("/c/:username").get(verifyJWT, getUSerChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)


export default router