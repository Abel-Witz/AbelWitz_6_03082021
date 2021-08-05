const express = require("express");
const router = express.Router();
const authorize = require("../middlewares/authorize");
const sauceController = require("../controllers/sauce");

router.post("/", authorize, sauceController.postSauce);
router.post("/:id/like", authorize, sauceController.likeOrDislikeSauce);
router.get("/", authorize, sauceController.getSauces);
router.get("/:id", authorize, sauceController.getSauce);
router.put("/:id", authorize, sauceController.updateSauce);
router.delete("/:id", authorize, sauceController.deleteSauce);

module.exports = router;