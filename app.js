(async () => {
    const requiredEnvironmentVariables = ["DB_URL", "PORT", "JWT_SECRET"];

    try {
        // Loads environment variables from .env file intro process.env
        const config = require("dotenv").config();

        if ( config.error ) {
            throw config.error;
        }

        if ( config && config.parsed ) {
            for (let i of requiredEnvironmentVariables) {
                if ( process.env[i] === undefined ) {
                    throw Error(`Can't start app because ${i} environment variable was not defined in .env file`);
                }
            }
        }

        // Connect to Database
        await require("mongoose").connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});

        // Launch app
        const express = require("express");
        const app = express();
        const authRouter = require("./routes/auth");
        
        app.use(express.json());
        app.use("/auth", authRouter);

        app.listen(process.env.PORT, () => {
            console.log(`Listening at port ${process.env.PORT}`);
        });

    } catch (error) {
        console.error(error);
    }
})();