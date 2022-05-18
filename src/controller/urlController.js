const validUrl = require('valid-url')
const shortid = require('shortid')
const urlModel = require("../model/urlModel")

const { isValidRequestBody} = require("../util/validator");

const urlShortner = async function (req, res) {
    try {
        const requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }

        const longUrl = requestBody.longUrl;
        const baseUrl = "http://localhost:3000"

        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: 'Invalid longUrl' })
        }
        
        //Before creating the short URL,we check if the long URL was in the DB ,else we create it.

        const urlAlreadyInDb = await urlModel.findOne({ longUrl }).select({ shortUrl: 1, longUrl: 1, urlCode: 1, _id: 0 });

        if(urlAlreadyInDb){
            return res.status(200).send({ status: true, message: 'Url Shorten Successfully', data:urlAlreadyInDb })  
        }else{
            const urlCode = shortid.generate().toLowerCase();
            const shortUrl = baseUrl + '/' + urlCode;

            const newUrl = {
                longUrl: longUrl.trim(),
                shortUrl: shortUrl,
                urlCode: urlCode
            }

            const urlCreated = await urlModel.create(newUrl);
            return res.status(200).send({ status: true, message: 'Url Shorten Successfully', data:urlCreated }) 
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}






module.exports = { urlShortner };