const fs = require("fs");
const uuid4 = require("uuid").v4;
const mongoose = require("mongoose");
const multer = require("multer");
const multerUpload = require("../middlewares/multer");
const Sauce = require("../models/sauce");


// Client input validation
function isSauceJsonDataValid(sauceJson) {
    if (typeof sauceJson.name !== "string") {
        return "Sauce data doesn't contain a name string !";
    }
    if (typeof sauceJson.manufacturer !== "string") {
        return "Sauce data doesn't contain a manufacturer string !";
    }
    if (typeof sauceJson.description !== "string") {
        return "Sauce data doesn't contain a description string !";
    }
    if (typeof sauceJson.mainPepper !== "string") {
        return "Sauce data doesn't contain a mainPepper string !";
    }
    if (typeof sauceJson.heat !== "number") {
        return "Sauce data doesn't contain a heat number!";
    } else if (sauceJson.heat > 10 | sauceJson.heat < 1) {
        return "The heat of the sauce must be between 0 and 10 !";
    }

    return true;
}


// Images uploading
function getUrlFromImageFilename(filename) {
    return "http://" + app.get("host") + ":" + app.get("port") + "/image-uploads/" + filename;
}

function getImageFilenameFromUrl(url) {
    const splittedString = url.split('/');
    return splittedString[splittedString.length - 1];
}

function removeImageFromFilename(filename) {
    fs.unlink("./image-uploads/" + getImageFilenameFromUrl(filename), (err => {
        if (err) {
            console.error(err);
            return err;
        }
    }));
}

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png"
}

function generateImageFilename(multerFile) {
    const fileExtension = MIME_TYPES[multerFile.mimetype];
    return `${uuid4()}.${fileExtension}`;
}

function writeImageBufferIntoFile(file, fileName) {
    const filePath = `./image-uploads/${fileName}`;

    fs.writeFile(filePath, file.buffer, (err) => {
        if (err) {
            console.error(err);
            return;
        };

        return filePath;
    });
};


// Create a new sauce
exports.postSauce = (req, res) => {
    // Multer middleware
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
        

        // Check for errors
        if (!req.file) {
            res.status(400).json({message: "Sauce image is missing !"});
            return;
        }

        if (typeof req.body.sauce !== "string") {
            res.status(400).json({message: "Sauce data is missing !"});
            return
        }


        // Store the json sent by client
        let sauceJson;
        try {
            sauceJson = JSON.parse(req.body.sauce);
        } catch (error) {
            res.status(400).json({message: "Sauce data format is incorrect, must be in stringified JSON !"});
            return;
        }


        // Check for errors
        const isValid = isSauceJsonDataValid(sauceJson);

        if (isValid !== true) {
            res.status(400).json({message: isValid});
            return
        }


        // Add data to the sauce
        const imageFilename = generateImageFilename(req.file);

        sauceJson.userId = req.userId;
        sauceJson.imageUrl = getUrlFromImageFilename(imageFilename);
        sauceJson.likes = 0;
        sauceJson.dislikes = 0;
        sauceJson.usersLiked = [];
        sauceJson.usersDisliked = [];
        delete sauceJson.__v;


        // Save sauce id db
        const sauce = new Sauce(sauceJson);
        sauce.save()
            .then(() => {
                // Save the image to disk from the buffer
                writeImageBufferIntoFile(req.file, imageFilename);

                res.status(200).json({message: "Sauce successfully created !"});
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({message: "Internal server error"});
            })
    })
}


// Like/dislkine a sauce
exports.likeOrDislikeSauce = (req, res) => {
    // Check for errors
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({message: "Sauce id must be a single String of 12 bytes or a string of 24 hex characters"});
        return;
    }

    if (req.body.userId !== req.userId) {
        res.status(400).json({message: "The userId provided doesn't match with yours !"});
        return;
    }

    if (!(req.body.like === 1 | req.body.like === 0 | req.body.like === -1)) {
        res.status(400).json({message: "The like number value must be 1, 0 or -1 !"});
        return;
    }


    // Check that the sauce exists in db
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if (!sauce) {
                res.status(400).json({message: "Sauce " + req.params.id + " doesn't exist"});
                return;
            }

            // Update the usersLiked and usersDisliked arrays
            const likeIndex = sauce.usersLiked.findIndex((element) => element === req.userId);
            if (likeIndex !== -1) { sauce.usersLiked.splice(likeIndex, 1); }
            const dislikeIndex = sauce.usersDisliked.findIndex((element) => element === req.userId);
            if (dislikeIndex !== -1) { sauce.usersDisliked.splice(dislikeIndex, 1); }

            if  (req.body.like === 1) {
                sauce.usersLiked.push(req.userId);
            } else if (req.body.like === -1) {
                sauce.usersDisliked.push(req.userId);
            }

            // Update the calculated likes and dislikes values
            sauce.likes = sauce.usersLiked.length;
            sauce.dislikes = sauce.usersDisliked.length;

            // Update the sauce in db
            sauce.save()
                .then(() => {
                    res.status(200).json({message: "Success !"});
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({message: "Internal server error"});
                })
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        });
}


// Get all the sauces
exports.getSauces = (req, res) => {
    // Get the sauces in db
    Sauce.find()
        .then((sauces) => {
            res.status(200).json(sauces);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        })
}


// Get a sauce
exports.getSauce = (req, res) => {
    // Check for errors
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({message: "Sauce id must be a single String of 12 bytes or a string of 24 hex characters"});
        return;
    }

    // Find the sauce in db
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            res.status(200).json(sauce);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        })
}


// Update a sauce
exports.updateSauce = (req, res) => {
    // Check for errors
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({message: "Sauce id must be a single String of 12 bytes or a string of 24 hex characters"});
        return;
    }


    // Multer middleware
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
        

        // Store the json and the filename of the image sent by client
        let imageFilename;

        let sauceJson;
        if (req.file) {
            if (typeof req.body.sauce === "string") {
                try {
                    sauceJson = JSON.parse(req.body.sauce);
                } catch (error) {
                    res.status(400).json({message: "Sauce data format is incorrect, must be in stringified JSON !"});
                    return;
                }
            } else {
                sauceJson = {};
            }

            imageFilename = generateImageFilename(req.file);
            sauceJson.imageUrl = getUrlFromImageFilename(imageFilename);
        } else {
            if (Object.keys(req.body).length === 0) {
                res.status(400).json({message: "Sauce data is missing !"});
                return;
            } else {
                sauceJson = req.body;
            }
        }


        // Check for errors
        const isValid = isSauceJsonDataValid(sauceJson);

        if (isValid !== true) {
            res.status(400).json({message: isValid});
            return;
        }


        // Strip away all the potential present malicious values in the sauce data sent by the client
        delete sauceJson.userId;
        delete sauceJson.likes;
        delete sauceJson.dislikes;
        delete sauceJson.usersLiked;
        delete sauceJson.usersDisliked;
        delete sauceJson.__v;


        // Check that the sauce exists in db
        Sauce.findOne({_id: req.params.id})
            .then((sauce) => {
                if (!sauce) {
                    res.status(400).json({message: "Sauce " + req.params.id + " doesn't exist"});
                    return;
                }

                // Update the sauce in db
                if (sauce.userId === req.userId) {
                    if ( req.file ) {
                        // Delete old image from storage if it was changed
                        removeImageFromFilename(getImageFilenameFromUrl(sauce.imageUrl));
                        // Save the image to disk from the buffer
                        writeImageBufferIntoFile(req.file, imageFilename);
                    }

                    Sauce.updateOne({_id: req.params.id}, sauceJson)
                        .then((query) => {
                            res.status(200).json({message: "Sauce successfully updated !"});
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).json({message: "Internal server error"});
                        })
                } else {
                    res.status(403).json({message: "Your userId doesn't match with the userId associated to the sauce"});
                    return;
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({message: "Internal server error"});
            });
    })
}


// Delete a specific sauce
exports.deleteSauce = (req, res) => {
    // Check for errors
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({message: "Sauce id must be a single String of 12 bytes or a string of 24 hex characters"});
        return;
    }

    // Check that the sauce exists in db
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if (!sauce) {
                res.status(400).json({message: "Sauce " + req.params.id + " doesn't exist"});
                return;
            }

            // If the client is the author of the sauce we delete it
            if (sauce.userId === req.userId) {
                sauce.remove()
                    .then((returnedSauce) => {
                        // Remove the image attached to the sauce
                        removeImageFromFilename(getImageFilenameFromUrl(returnedSauce.imageUrl));

                        res.status(200).json({message: "Sauce successfully deleted !"});
                    })
                    .catch((err) => {
                        console.error(err);
                        res.status(500).json({message: "Internal server error"});
                    })
            } else {
                res.status(403).json({message: "Your userId doesn't match with the userId associated to the sauce"});
                return;
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        })
}