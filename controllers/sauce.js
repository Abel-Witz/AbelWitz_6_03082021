const multer = require("multer");
const multerUpload = require("../middlewares/multer");

exports.postSauce = (req, res) => {
    multerUpload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            if (err.code === "LIMIT_UNEXPECTED_FILE") {
                res.status(400).json({message: `Unexpected file field: '${err.field}'`});
            }

            return;
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error(err);
            res.status(500).json({message: "Internal server error"});
            return;
        }
        
        // Everything went fine.
        if (!req.file) {
            res.status(400).json({message: "Sauce image is missing !"});
            return;
        }

        if (!req.sauce) {
            res.status(400).json({message: "Sauce data is missing !"});
            return
        }

        res.status(200).end();
    })
}