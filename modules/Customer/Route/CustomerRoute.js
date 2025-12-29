const express = require("express");
const router = express.Router();

const { verifyJWT } = require("../../../middleware/jwt");
const upload = require("../../../middleware/multer");

const customerController = require("../Controller/CustomerController");

// Customer Management

router.post("/add-customer", upload.none(), verifyJWT, customerController.createCustomer);
router.get("/get-all-customers", upload.none(), verifyJWT, customerController.getAllCustomers);
router.post("/search-customer", upload.none(), verifyJWT, customerController.searchCustomersByTerm);
router.get("/get-all-customers-for-projects", upload.none(), verifyJWT, customerController.getAllCustomersForProjects);
router.post("/search-customer-for-projects", upload.none(), verifyJWT, customerController.searchCustomersForProjectsByTerm);
router.get("/get-customers-dpd", upload.none(), verifyJWT, customerController.getCustomersDpd);
router.get("/get-customer/:customerId", upload.none(), verifyJWT, customerController.getCustomerById);
router.get("/delete-customer/:customerId", upload.none(), verifyJWT, customerController.deleteCustomer);
router.post("/edit-customer/:customerId", upload.none(), verifyJWT, customerController.updateCustomer);
router.get("/customer-projects/:customerId", upload.none(), verifyJWT, customerController.getCustomerProjects);
router.post("/search-customer-projects/:customerId", upload.none(), verifyJWT, customerController.searchCustomerProjectByTerm);

module.exports = router;