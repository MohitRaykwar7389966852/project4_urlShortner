const express = require('express');
const router = express.Router();

const {urlShortner } = require("../controller/urlController")


router.post("/url/shorten",urlShortner)
// router.get("/functionup/colleges", collegeController.createCollege)
// router.get("/functionup/collegeDetails",collegeController.collegeDetails)


module.exports = router;