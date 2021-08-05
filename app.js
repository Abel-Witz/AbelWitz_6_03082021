(async () => {
    // Loads environment variables from .env file intro process.env
    const requiredEnvironmentVariables = ["HOST", "PORT", "FRONTEND_ADRESS", "DB_URL", "JWT_SECRET"];
    const config = require("dotenv").config();

    if ( config.error ) {
        console.error(config.error);
    }

    if ( config && config.parsed ) {
        for (let i of requiredEnvironmentVariables) {
            if ( process.env[i] === undefined ) {
                console.error(Error(`Can't start app because ${i} environment variable was not defined in .env file`));
                return;
            }
        }
    }

    // Connect to Database
    await require("mongoose").connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});

    // Launch app
    const express = require("express");
    app = express();
    const path = require("path");
    const authRouter = require("./routes/auth");
    const sauceRouter = require("./routes/sauce");
    
    app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ADRESS);
        res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "PUT, DELETE")
        next();
    })

    app.use("/image-uploads", express.static(path.join(__dirname, "image-uploads")));
    app.use(express.json());
    app.use("/api/auth", authRouter);
    app.use("/api/sauces", sauceRouter);

    const server = app.listen(process.env.PORT, process.env.HOST, () => {
        const host = server.address().address;
        const port = server.address().port;
        app.set("host", host);
        app.set("port", port);
        console.log(`Listening at http://${host}:${port}`);
    });
})();