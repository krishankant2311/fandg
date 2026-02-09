const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../../../middleware/jwt");

const chemicalMaintenanceController = require("../Controller/chemicalMaintenanceController");

// -------------------------------
// Chemical Customer APIs
// -------------------------------

// Save Chemical Maintenance customer (with schedule)
router.post(
  "/customers",
  verifyJWT,
  chemicalMaintenanceController.createChemicalCustomer
);

// List Chemical Maintenance customers
router.get(
  "/customers",
  verifyJWT,
  chemicalMaintenanceController.getChemicalCustomers
);

// Get single customer by ID
router.get(
  "/customers/:id",
  verifyJWT,
  chemicalMaintenanceController.getChemicalCustomerById
);

// Update customer
router.put(
  "/customers/:id",
  verifyJWT,
  chemicalMaintenanceController.updateChemicalCustomer
);

// Delete customer (soft delete)
router.delete(
  "/customers/:id",
  verifyJWT,
  chemicalMaintenanceController.deleteChemicalCustomer
);

// -------------------------------
// Chemical Mixes CRUD
// -------------------------------
router.post(
  "/mixes",
  verifyJWT,
  chemicalMaintenanceController.createChemicalMix
);

router.get(
  "/mixes",
  verifyJWT,
  chemicalMaintenanceController.getAllChemicalMixes
);

router.put(
  "/mixes/:id",
  verifyJWT,
  chemicalMaintenanceController.updateChemicalMix
);

router.delete(
  "/mixes/:id",
  verifyJWT,
  chemicalMaintenanceController.deleteChemicalMix
);

module.exports = router;