const fs = require('fs');
const path = require("path");
const multer = require("multer");

// Create image-uploads folder if it doesn't exist
if (!fs.existsSync("./image-uploads")){
    fs.mkdirSync("./image-uploads");
}

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {fileSize: 2000000},
    fileFilter: function(req, file, cb) {
        const fileTypes = /png|jpeg|jpg/;
        const isExtNameValid = fileTypes.test(path.extname(file.originalname.toLowerCase()));
        const isMimeTypeValid = fileTypes.test(file.mimetype);

        if (isExtNameValid && isMimeTypeValid) {
            cb(null, true);
        } else {
            const res = req.res;
            res.status(400).json({message: Error("Only png, jpeg and jpg sauce images are allowed !").toString()});
        }
    }
});

module.exports = upload.single("image");