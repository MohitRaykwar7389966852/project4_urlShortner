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

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//---------------------------------------------< Url Shortner >-----------------------------------------------------------

const urlShortner = async function (req, res) {
    try {
        const requestBody = req.body;

        if (Object.keys(requestBody).length === 0) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }
        
        const longUrl = requestBody.longUrl;
        const baseUrl = "http://localhost:3000";
        const urlCode = shortid.generate().toLowerCase();
        const shortUrl = baseUrl + '/' + urlCode;

        if (!longUrl) {
            return res.status(400).send({ status: false, message: 'Please Enter the longUrl' })
        }

        if (Object.keys(requestBody).length > 1) {
            return res.status(400).send({ status: false, message: "Please Enter the longUrl Only" });
        }

        //if(!/(ftp|http|https|HTTP|HTTPS):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(longUrl))
        if (!validUrl.isUri(longUrl)){
            return res.status(400).send({ status: false, message: 'Invalid longUrl' })
        }

         // Before creating the short URL,we check if the long URL was in the Cache ,else we will check in the DB.

        let urlAlreadyInCache = await GET_ASYNC(`${longUrl}`)
        if (urlAlreadyInCache) {
            return res.status(200).send({status: true, message: 'Url Already In Cache',data: JSON.parse(urlAlreadyInCache)})
        }

        // Before creating the short URL,we check if the long URL was in the DB ,else we create it.

        const urlAlreadyInDb = await urlModel.findOne({ longUrl }).select({ longUrl: 1,shortUrl: 1, urlCode: 1, _id: 0 });
        if (urlAlreadyInDb) {

            await SET_ASYNC(`${longUrl}`, JSON.stringify(urlAlreadyInDb), "EX",90);
            await SET_ASYNC(`${urlCode}`, JSON.stringify(urlAlreadyInDb.longUrl), "EX",90);

            return res.status(200).send({ status: true, message: 'Url Already In Db', data: urlAlreadyInDb })
        } else {

            const newUrl = {
                longUrl: longUrl.trim(),
                shortUrl: shortUrl,
                urlCode: urlCode
            }
            const urlCreated = await urlModel.create(newUrl);

            const resUrl ={
                longUrl: urlCreated.longUrl,
                shortUrl: urlCreated.shortUrl,
                urlCode: urlCreated.urlCode
            }

            await SET_ASYNC(`${longUrl}`, JSON.stringify(newUrl), "EX",90);
            await SET_ASYNC(`${urlCode}`, JSON.stringify(newUrl.longUrl), "EX",90);

            return res.status(201).send({ status: true, message: 'Url Shorten Successfully', data: resUrl })
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

//-------------------------------------------------< Get Url >---------------------------------------------------------------

const urlRedirect = async function (req, res) {
    try {
        let urlCode = req.params.urlCode

        let urlCodeAlreadyInCache = await GET_ASYNC(`${urlCode}`)
        if (urlCodeAlreadyInCache) {
            return res.status(302).redirect(JSON.parse(urlCodeAlreadyInCache))
        } else {

            let findUrl = await urlModel.findOne({ urlCode: urlCode })
            if (!findUrl) {
                return res.status(404).send({ status: false, message: "Url Code not found" })
            }

            await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrl.longUrl), "EX",90);
            return res.status(302).redirect(findUrl.longUrl)
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = { urlShortner, urlRedirect };