const express = require("express");
const rooter = express.Router();
const authController = require("../controllers/auth");

rooter.post("/signup", authController.signup);
rooter.post("/login", authController.login);

module.exports = rooter;