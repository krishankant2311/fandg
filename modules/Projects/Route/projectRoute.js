const express = require("express");
const router = express.Router();

const { verifyJWT } = require("../../../middleware/jwt");
const upload = require("../../../middleware/multer");

const projectController = require("../Controller/projectController");

// Project Management

router.post("/add-project", upload.none(), verifyJWT, projectController.createProject);
router.post("/add-bid", upload.none(), verifyJWT, projectController.createBid);
router.get("/get-projects", upload.none(), verifyJWT, projectController.getProjectList);
router.get("/get-completed-projects", upload.none(), verifyJWT, projectController.getCompletedProjectList);
router.get("/get-billed-projects", upload.none(), verifyJWT, projectController.getBilledProjectList);
router.get("/get-deleted-projects", upload.none(), verifyJWT, projectController.getDeletedProjectList);
router.get("/get-bid-projects", upload.none(), verifyJWT, projectController.getBidProjectList);
router.post("/get-compiled-projects", upload.none(), verifyJWT, projectController.getCompiledProjects);
router.get("/get-project/:projectId", upload.none(), verifyJWT, projectController.getProjectById);
router.post("/edit-project/:projectId", upload.none(), verifyJWT, projectController.editProjects);
router.post("/search-all-project", upload.none(), verifyJWT, projectController.searchAllProjectByTerm);
router.post("/search-completed-project", upload.none(), verifyJWT, projectController.searchCompletedProjectByTerm);
router.post("/search-billed-project", upload.none(), verifyJWT, projectController.searchBilledProjectByTerm);
router.post("/search-bid-project", upload.none(), verifyJWT, projectController.searchBidProjectByTerm);

// Field Copy

router.post("/add-field-copy/:projectId", upload.none(), verifyJWT, projectController.addFieldCopy);
router.get("/get-field-copy-timing/:projectId", upload.none(), verifyJWT, projectController.getTodayFieldCopyTiming);
router.post("/edit-field-copy-date/:projectId", upload.none(), verifyJWT, projectController.updateFieldCopyDate);
router.post("/edit-customer-field-copy/:projectId", upload.none(), verifyJWT, projectController.editCustomerFieldCopy);
router.post("/edit-bided-field-copy/:projectId", upload.none(), verifyJWT, projectController.editBidedFieldCopy);
router.post("/delete-field-copy/:projectId/:fieldId", upload.none(), verifyJWT, projectController.deleteFieldCopy);

// Customer copy
router.post("/generate-customer-copy/:projectId", upload.none(), verifyJWT, projectController.addCustomerFieldCopy);
router.get("/get-customer-list/:projectId", upload.none(), verifyJWT, projectController.getCustomerCopyList);
router.get("/get-customer-copy/:projectId/:entryDate/:index", upload.none(), verifyJWT, projectController.getCustomerCopyByIndex);
router.post("/edit-customer-copy-name/:projectId/:entryDate/:index", upload.none(), verifyJWT, projectController.editCustomerCopyName);

// Draft Copy

router.post("/add-draft-copy/:projectId", upload.none(), verifyJWT, projectController.addDraftCopy);
router.get("/get-office-draft-copy/:projectId", upload.none(), verifyJWT, projectController.getofficeDraftCopy);
router.get("/get-draft-copy/:projectId/:date", upload.none(), verifyJWT, projectController.getDraftCopyByDate);
router.post("/edit-draft-copy/:projectId/:date", upload.none(), verifyJWT, projectController.editDraftCopy);
router.post("/delete-draft-copy/:projectId/:date", upload.none(), verifyJWT, projectController.deleteDraftCopy);
router.post("/save-draft-to-office/:projectId/:date", upload.none(), verifyJWT, projectController.saveDraftCopyToOfficeCopy);

// Others
router.get("/get-materials-dpd", upload.none(), verifyJWT, projectController.getAllMaterials);
router.get("/get-job-type/:jobId", upload.none(), verifyJWT, projectController.getJobTypeById);

// --

router.post("/handle-field-copy/:projectId/:fieldId", upload.none(), verifyJWT, projectController.handleFieldCopyStatus);
router.post("/update-field-copy/:projectId/:fieldId", upload.none(), verifyJWT, projectController.updateFieldCopy);
router.get("/get-field-copy/:projectId/:fieldId", upload.none(), verifyJWT, projectController.getFieldCopyById);
router.get("/get-office-field-copy/:projectId", upload.none(), verifyJWT, projectController.getofficeFieldCopy);
router.get("/get-office-field-copy-by-job/:projectId", upload.none(), verifyJWT, projectController.getOfficeCopiesByJobType);
router.get("/get-office-field-copy-without-pagination/:projectId", upload.none(), verifyJWT, projectController.getofficeFieldCopyWithoutPagination);
router.get("/get-customer-field-copy/:projectId", upload.none(), verifyJWT, projectController.getCustomerFieldCopy);
router.get("/get-bided-field-copy/:projectId", upload.none(), verifyJWT, projectController.getBidedFieldCopy);
router.get("/get-customer-field-copy-by-job/:projectId", upload.none(), verifyJWT, projectController.getCustomerCopiesByJobType);
router.get("/get-customer-project-info/:projectId", upload.none(), verifyJWT, projectController.getCustomerProjectData);

router.post("/get-field-copies-by-date/:projectId", upload.none(),verifyJWT, projectController.getFieldCopiesByDate);

module.exports = router;
