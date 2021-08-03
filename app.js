(async () => {
    try {
        // Loads environment variables from .env file intro process.env
        let appPort;
        let dbUrl;

        const config = require("dotenv").config();

        if ( config.error ) {
            throw config.error;
        }

        if ( config && config.parsed ) {
            if ( config.parsed.DB_URL === undefined ) {
                throw Error("Can't start app because DB_URL environment variable was not defined in .env file");
            }
            dbUrl = config.parsed.DB_URL;
            
            if ( config.parsed.PORT === undefined ) {
                throw Error("Can't start app because PORT environment variable was not defined in .env file");
            }
            appPort = config.parsed.PORT;
        }

        // Connect to Database
        await require("mongoose").connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});

        // Launch app
        const express = require("express");
        const app = express();

        app.get("/", (req, res) => {
            res.send("Hello World!");
        });

        app.listen(process.env.PORT, () => {
            console.log(`Listening at port ${appPort}`);
        });

    } catch (error) {
        console.error(error);
    }
})();