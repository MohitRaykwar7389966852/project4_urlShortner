const validUrl = require('valid-url')
const shortid = require('shortid')
const urlModel = require("../model/urlModel")

const { isValidRequestBody, isValidData } = require("../util/validator");

const urlShortner = async function (req,res){
    try {
      const requestBody = req.body;

      if(!isValidRequestBody(requestBody)){
       return res.status(400).send({ status: false, message: "Please enter some Data" });
      }
      
        
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}






module.exports = { urlShortner };