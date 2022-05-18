const express = require('express');
const router = express.Router();

const {urlShortner,urlRedirect } = require("../controller/urlController")


router.post("/url/shorten",urlShortner)
router.get("/url/:urlCode",urlRedirect)
// router.get("/functionup/collegeDetails",collegeController.collegeDetails)


module.exports = router;