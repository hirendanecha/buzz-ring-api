var express = require("express");
var router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");

router.use("/login", authRoutes);
router.use("/customers", userRoutes);

module.exports = router;
