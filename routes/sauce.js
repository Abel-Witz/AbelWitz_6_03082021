const express = require("express");
const router = express.Router();
const authorize = require("../middlewares/authorize");
const sauceController = require("../controllers/sauce");

router.post("/", authorize, sauceController.postSauce);

module.exports = router;