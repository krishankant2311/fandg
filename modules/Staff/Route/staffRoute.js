const express = require('express');
const router = express.Router();

const {verifyJWT} = require('../../../middleware/jwt');
const upload = require("../../../middleware/multer");

const staffController = require("../Controller/staffController");

// Staff Account
router.post("/login", upload.none(), staffController.staffLogin);
router.post("/forgot-password", upload.none(), staffController.forgetPassword);
router.post("/reset-password", upload.none(), staffController.resetPassword);
router.post("/change-password", upload.none(), staffController.changePassword);

router.get("/get-tax-percent", upload.none(),verifyJWT, staffController.getTaxPercentStaff);


module.exports = router;