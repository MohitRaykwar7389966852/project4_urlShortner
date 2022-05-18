const validUrl = require('valid-url')
const shortid = require('shortid')

const urlModel = require("../model/urlModel")

const redis = require("redis");
const { promisify } = require("util");

//---------------------------------------------< Connect to redis >-----------------------------------------------------------

const redisClient = redis.createClient(
    19631,
    "redis-19631.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("WGqnMu6b0QSWECZAEY3B8EFshoc6MSJI", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//---------------------------------------------< Url Shortner >-----------------------------------------------------------

const urlShortner = async function (req, res) {
    try {
        const requestBody = req.body;

        if (Object.keys(requestBody).length === 0) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }

        if (Object.keys(requestBody).length > 1) {
            return res.status(400).send({ status: false, message: "Please Enter the Long Url Only" });
        }

        const longUrl = requestBody.longUrl;
        const baseUrl = "http://localhost:3000"

        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: 'Invalid longUrl' })
        }

        //Before creating the short URL,we check if the long URL was in the DB ,else we create it.
        const urlAlreadyInDb = await urlModel.findOne({ longUrl }).select({ shortUrl: 1, longUrl: 1, urlCode: 1, _id: 0 });

        if (urlAlreadyInDb) {
            return res.status(200).send({ status: true, message: 'Url Shorten Successfully', data: urlAlreadyInDb })
        } else {
            const urlCode = shortid.generate().toLowerCase();
            const shortUrl = baseUrl + '/' + urlCode;

            const newUrl = {
                longUrl: longUrl.trim(),
                shortUrl: shortUrl,
                urlCode: urlCode
            }

            const urlCreated = await urlModel.create(newUrl);
            return res.status(201).send({ status: true, message: 'Url Shorten Successfully', data: urlCreated })
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

//-------------------------------------------------< Get Url >---------------------------------------------------------------

const urlRedirect = async function (req, res) {
    try {
        let urlCode = req.params.urlCode

        let cahcedUrlCode = await GET_ASYNC(urlCode)
        if (cahcedUrlCode) {
            return res.status(302).redirect(cahcedUrlCode)
        } else {

            let findUrl = await urlModel.findOne({ urlCode: urlCode })
            if (!findUrl) {
                return res.status(404).send({ status: false, message: "Url Code not found" })
            }

            await SET_ASYNC(urlCode, findUrl.longUrl)
            return res.status(302).redirect(findUrl.longUrl)
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = { urlShortner, urlRedirect };