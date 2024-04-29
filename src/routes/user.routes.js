const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const profileController = require("./../controllers/profile.controller");
const authorize = require("../middleware/authorize");

router.post("/verify-token", userController.verifyToken);
router.post("/register-device", userController.registerDevice);
router.post("/call-notification/", userController.callNotification);
router.post("/group-call-notification/", userController.groupCallNotification);
// router.use(authorize.authorization);
router.get("/logout", userController.logout);
router.get("/:id", userController.findById);
router.get("/notification/:id", profileController.getNotification);
router.delete("/delete/:id", userController.deleteProfile);

module.exports = router;
