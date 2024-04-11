const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const profileController = require("./../controllers/profile.controller");
const authorize = require("../middleware/authorize");

router.post("/verify-token", userController.verifyToken);
router.use(authorize.authorization);
router.get("/logout", userController.logout);
router.get("/:id", userController.findById);
router.get("/notification/:id", profileController.getNotification);
router.post("/call-notification/", profileController.getNotification);

module.exports = router;
