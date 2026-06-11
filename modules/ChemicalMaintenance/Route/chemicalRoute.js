const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../../../middleware/jwt");

const chemicalController = require("../Controller/chemicalController");
const otherTreatmentController = require("../Controller/otherTreatmentController");

// Create
router.post("/add-chemical", verifyJWT, chemicalController.addChemical);

// Read (list with pagination / search / sort)
router.get("/get-all-chemical", verifyJWT, chemicalController.getAllChemical);

// Update
router.put(
  "/update-chemical/:id",
  verifyJWT,
  chemicalController.updateChemical
);

// Delete (soft delete)
router.delete(
  "/delete-chemical/:id",
  verifyJWT,
  chemicalController.deleteChemical
);

// Other Treatments master list
router.post(
  "/add-other-treatment",
  verifyJWT,
  otherTreatmentController.addOtherTreatment
);
router.get(
  "/get-all-other-treatment",
  verifyJWT,
  otherTreatmentController.getAllOtherTreatments
);
router.put(
  "/update-other-treatment/:id",
  verifyJWT,
  otherTreatmentController.updateOtherTreatment
);
router.delete(
  "/delete-other-treatment/:id",
  verifyJWT,
  otherTreatmentController.deleteOtherTreatment
);
router.post(
  "/seed-other-treatments",
  verifyJWT,
  otherTreatmentController.seedDefaultOtherTreatments
);

module.exports = router;