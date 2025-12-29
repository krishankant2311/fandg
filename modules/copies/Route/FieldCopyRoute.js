const express = require('express');
const router = express.Router();

const {verifyJWT} = require('../../../middleware/jwt');
const upload = require("../../../middleware/multer");

const fieldCopyController = require("../Controller/FieldCopyController");

// Staff Account
router.post("/get-field-copies-by-date/:projectId", upload.none(), fieldCopyController.getFieldCopiesByDate);


module.exports = router;