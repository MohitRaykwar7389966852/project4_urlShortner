const express = require('express');
const router = express.Router();

const {urlShortner,urlRedirect } = require("../controller/urlController")


router.post("/url/shorten",urlShortner)
router.get("/:urlCode",urlRedirect)



module.exports = router;