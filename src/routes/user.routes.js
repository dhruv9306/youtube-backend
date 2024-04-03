import {Router} from "express"
import {registerUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { loginuser,logoutuser,refreshAccessToken } from "../controllers/user.controller.js"
import{verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:2

        },
        {
            name:"coverimage",
            maxCount:2

        }
    ]),
    registerUser
    )


router.route("/login").post(loginuser)

router.route("/logout").post(verifyJWT, logoutuser)

router.route("/refreshtoken").post(refreshAccessToken)

export default router