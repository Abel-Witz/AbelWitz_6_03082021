const fs = require("fs");
const mongoose = require("mongoose");
const multer = require("multer");
const multerUpload = require("../middlewares/multer");
const Sauce = require("../models/sauce");

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

        if (typeof req.body.sauce !== "string") {
            res.status(400).json({message: "Sauce data is missing !"});
            return
        }

        let sauceJson;
        try {
            sauceJson = JSON.parse(req.body.sauce);
        } catch (error) {
            res.status(400).json({message: "Sauce data format is incorrect, must be in stringified JSON !"});
            return;
        }

        const isValid = isSauceJsonDataValid(sauceJson);

        if (isValid !== true) {
            res.status(400).json({message: isValid});
            return
        }

        // Add data to the sauce
        sauceJson.userId = req.userId;
        sauceJson.imageUrl = getUrlFromImageFilename(req.file.filename);
        sauceJson.likes = 0;
        sauceJson.dislikes = 0;
        sauceJson.usersLiked = [];
        sauceJson.usersDisliked = [];
        delete sauceJson.__v;

        const sauce = new Sauce(sauceJson);
        sauce.save()
            .then(() => {
                res.status(200).json({message: "Sauce successfully created !"});
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({message: "Internal server error"});
            })
    })
}

exports.likeOrDislikeSauce = (req, res) => {
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

    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if (!sauce) {
                res.status(400).json({message: "Sauce " + req.params.id + " doesn't exist"});
                return;
            }

            const likeIndex = sauce.usersLiked.findIndex((element) => element === req.userId);
            if (likeIndex !== -1) { sauce.usersLiked.splice(likeIndex, 1); }
            const dislikeIndex = sauce.usersDisliked.findIndex((element) => element === req.userId);
            if (dislikeIndex !== -1) { sauce.usersDisliked.splice(dislikeIndex, 1); }

            if  (req.body.like === 1) {
                sauce.usersLiked.push(req.userId);
            } else if (req.body.like === -1) {
                sauce.usersDisliked.push(req.userId);
            }

            sauce.likes = sauce.usersLiked.length;
            sauce.dislikes = sauce.usersDisliked.length;

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

exports.getSauces = (req, res) => {
    Sauce.find()
        .then((sauces) => {
            res.status(200).json(sauces);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        })
}

exports.getSauce = (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({message: "Sauce id must be a single String of 12 bytes or a string of 24 hex characters"});
        return;
    }

    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            res.status(200).json(sauce);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        })
}

exports.updateSauce = (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({message: "Sauce id must be a single String of 12 bytes or a string of 24 hex characters"});
        return;
    }

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

            sauceJson.imageUrl = getUrlFromImageFilename(req.file.filename);
        } else {
            if (Object.keys(req.body).length === 0) {
                res.status(400).json({message: "Sauce data is missing !"});
                return;
            } else {
                sauceJson = req.body;
            }
        }

        // Strip away all the potential present malicious values in the sauce data sent by the client
        delete sauceJson.userId;
        delete sauceJson.likes;
        delete sauceJson.dislikes;
        delete sauceJson.usersLiked;
        delete sauceJson.usersDisliked;
        delete sauceJson.__v;

        Sauce.findOne({_id: req.params.id})
            .then((sauce) => {
                if (!sauce) {
                    res.status(400).json({message: "Sauce " + req.params.id + " doesn't exist"});
                    return;
                }

                if (sauce.userId === req.userId) {
                    // Delete old image from storage if it was changed
                    if ( req.file ) {
                        removeImageFromFilename(getImageFilenameFromUrl(sauce.imageUrl));
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

exports.deleteSauce = (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({message: "Sauce id must be a single String of 12 bytes or a string of 24 hex characters"});
        return;
    }

    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if (!sauce) {
                res.status(400).json({message: "Sauce " + req.params.id + " doesn't exist"});
                return;
            }

            if (sauce.userId === req.userId) {
                sauce.remove()
                    .then((returnedSauce) => {
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