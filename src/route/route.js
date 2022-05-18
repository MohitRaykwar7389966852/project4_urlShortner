const express = require('express');
const router = express.Router();

const {urlShortner } = require("../controller/urlController")


router.post("/url/shorten",urlShortner)
// router.get()


module.exports = router;