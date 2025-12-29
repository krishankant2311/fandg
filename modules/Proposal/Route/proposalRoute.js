const express = require("express");
const router = express.Router();

const { verifyJWT } = require("../../../middleware/jwt");
const upload = require("../../../middleware/multer");

const proposalController = require("../Controller/proposalController");


router.post("/create-proposal", verifyJWT, upload.none(), proposalController.createProposal);
router.get("/get-proposals", verifyJWT, upload.none(), proposalController.getAllProposals);
router.get("/get-copies/:proposalId", verifyJWT, upload.none(), proposalController.getProposalCopies);
router.post("/edit-proposal/:proposalId", verifyJWT, upload.none(), proposalController.editProposal);
router.post("/delete-proposal/:proposalId", verifyJWT, upload.none(), proposalController.deleteProposal);
router.get("/view-proposal/:proposalId", verifyJWT, upload.none(), proposalController.viewProposal);
router.post("/convert-to-proposal/:proposalId", verifyJWT, upload.none(), proposalController.convertProposalToProject);
router.post("/save-date-code/:proposalId", verifyJWT, upload.none(), proposalController.saveDateAndCode);

// closed Bids
router.post("/mark-closed", verifyJWT, upload.none(), proposalController.markProposalAsClosed);
router.get("/get-closed-proposals", verifyJWT, upload.none(), proposalController.getClosedProposals);

module.exports = router;