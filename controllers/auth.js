const epxress = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");


// Client input validation
function isEmailValid(email) {
    const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if ( emailRegex.test(email) ) {
        return true;
    }

    return false;
}


// Signup
exports.signup = (req, res) => {
    // Check for errors
    if ( !isEmailValid(req.body.email) ) {
        res.status(400).json({message: "Email is invalid !"});
        return;
    }

    if (typeof req.body.password !== "string") {
        res.status(400).json({message: "Password is invalid !"});
        return;
    }

    // Hash the password
    bcrypt.hash(req.body.password, 10)
        .then((hash) => {
            const newUser = new User({email: req.body.email, password: hash});

            // Store the new user in db with its password hash
            newUser.save()
                .then(() => {
                    res.status(200).json({message: "User created successfully !"});
                    return;
                })
                .catch((err) => {
                     // Error: The email is already taken
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


// Login to an existing user
exports.login = (req, res) => {
    // Check for errors
    if ( !isEmailValid(req.body.email) ) {
        res.status(400).json({message: "Email is invalid !"});
        return;
    }

    if (typeof req.body.password !== "string") {
        res.status(400).json({message: "Password is invalid !"});
        return;
    }


    // Search the user in db by its email
    User.findOne({email: req.body.email})
        .then((user) => {
            if (user) {
                // If we find the user in db we compare the password sent and the password hash
                bcrypt.compare(req.body.password, user.password)
                    .then((passwordMatch) => {
                        if ( passwordMatch ) {
                            // If the password match we send the client a JWT token containing his userId
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