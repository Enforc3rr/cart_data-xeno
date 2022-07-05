const express = require("express");
const {savingData, fetchInformation} = require("../controller/cartDataController");
const router = express.Router();


router.route("/saveData")
    .post(savingData);
router.route("/fetchData")
    .get(fetchInformation);

module.exports = router;