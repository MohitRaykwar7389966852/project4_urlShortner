const validUrl = require('valid-url')
const shortid = require('shortid')
const urlModel = require("../model/urlModel")

const { isValidRequestBody } = require("../util/validator");

const urlShortner = async function (req, res) {
    try {
        const requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }

        const longUrl = requestBody.longUrl;
        const baseUrl = "http://localhost:3000"

        if (!validUrl.isUri(baseUrl)) {
           return res.status(400).send({ status: false, message: 'Invalid baseUrl' })
        }
        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: 'Invalid longUrl' })
        }
        //Before creating the short URL,we check if the long URL was in the DB ,else we create it.

        const checkUrl = await urlModel.findOne({ longUrl }).select({ shortid: 1, longUrl: 1, urlcode: 1, _id: 0 });

        if (checkUrl) {
            return res.status(200).send({ status: true, message: 'use unique url', data: checkUrl })
        } else {
            const urlCode = shortid.generate().toLowerCase();
            const shortUrl = baseUrl + '/' + urlCode;

            const newUrl = {
                urlCode: urlCode,
                longUrl: longUrl.trim(),
                shortUrl: shortUrl
            }

            const urlCreated = await urlModel.create(newUrl);
            return res.status(200).send({ status: true, message: 'Url Shorten Successfully', data: urlCreated })
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

const urlRedirect = function (req, res) {
    try {
        let urlCode = req.params.urlCode
        let longUrl = await urlModel.find({ urlCode: urlCode }).select({ _id: 0, longUrl: 1 })
        if (!longUrl) return res.status(400).send({ status: false, message: "Url Code is not correct" })
        res.status(302).redirect(longUrl)
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


module.exports = { urlShortner, urlRedirect };