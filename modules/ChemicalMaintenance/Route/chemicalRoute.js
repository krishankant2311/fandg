const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../../../middleware/jwt");

const chemicalController = require("../Controller/chemicalController");

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

module.exports = router;