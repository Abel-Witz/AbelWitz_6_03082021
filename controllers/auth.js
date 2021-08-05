const epxress = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

function isEmailValid(email) {
    const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if ( emailRegex.test(email) ) {
        return true;
    }

    return false;
}

exports.signup = (req, res) => {
    if ( !isEmailValid(req.body.email) ) {
        res.status(400).json({message: "Email is invalid !"});
        return;
    }

    if (typeof req.body.password !== "string") {
        res.status(400).json({message: "Password is invalid !"});
        return;
    }

    bcrypt.hash(req.body.password, 10)
        .then((hash) => {
            const newUser = new User({email: req.body.email, password: hash});

            newUser.save()
                .then(() => {
                    res.status(200).json({message: "User created successfully !"});
                    return;
                })
                .catch((err) => {
                    if (err.errors && err.errors.email && err.errors.email.kind === "unique" ) {
                        res.status(400).json({message: "Email is already used !"});
                        return;
                    }

                    console.error(err);
                    res.status(500).json({message: "Internal server error"});
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        });
}

exports.login = (req, res) => {
    if ( !isEmailValid(req.body.email) ) {
        res.status(400).json({message: "Email is invalid !"});
        return;
    }

    if (typeof req.body.password !== "string") {
        res.status(400).json({message: "Password is invalid !"});
        return;
    }

    User.findOne({email: req.body.email})
        .then((user) => {
            if (user) {
                bcrypt.compare(req.body.password, user.password)
                    .then((passwordMatch) => {
                        if ( passwordMatch ) {
                            jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "24h"}, function(err, encoded) {
                                if (err) {
                                    console.error(err);
                                    res.status(500).json({message: "Internal server error"});
                                } else {
                                    res.status(200).json({userId: user._id, token: encoded});
                                }
                            })
                        } else {
                            res.status(401).json({message: "The email isn't associated to any existing account or the password is incorrect"});
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        res.status(500).json({message: "Internal server error"});
                    })
            } else {
                res.status(401).json({message: "The email isn't associated to any existing account or the password is incorrect"});
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        });
}