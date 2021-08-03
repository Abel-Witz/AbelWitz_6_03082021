const fs = require('fs');
const path = require("path");
const multer = require("multer");
const uuid4 = require("uuid").v4;

// Create image-uploads folder if it doesn't exist
if (!fs.existsSync("./image-uploads")){
    fs.mkdirSync("./image-uploads");
}

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png"
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./image-uploads");
    },
    filename: function(req, file, cb) {
        const fileExtension = MIME_TYPES[file.mimetype];
        cb(null, uuid4() + "." + fileExtension);
    }
})

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
            res.status(400).json({message: "Only png, jpeg and jpg sauce images are allowed !"});
            cb(null, false);
        }
    }
});

module.exports = upload.single("image");