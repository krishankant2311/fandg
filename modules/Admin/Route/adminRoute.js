const express = require("express");
const router = express.Router();

const { verifyJWT } = require("../../../middleware/jwt");
const upload = require("../../../middleware/multer");

const adminController = require("../Controller/adminController");

router.post("/admin-login", upload.none(), adminController.adminLogin);
router.post("/forgot-password", upload.none(), adminController.forgetPassword);
router.post("/reset-password", upload.none(), adminController.resetPassword);
router.post("/change-password", upload.none(),verifyJWT, adminController.changePassword);
router.post("/change-fg-address", upload.none(),verifyJWT, adminController.updateFGAddress);
router.get("/get-fg-address", upload.none(),verifyJWT, adminController.getFGAddress);
router.get("/get-all-counts", upload.none(),verifyJWT, adminController.getAllCounts);

// Staff Members
router.post("/add-staff", upload.none(), verifyJWT, adminController.addStaffMember);
router.get("/get-staffs", upload.none(), verifyJWT, adminController.getStaffMembers);
router.get("/get-active-staffs", upload.none(), verifyJWT, adminController.getActiveStaffMembers);
router.get("/get-blocked-staffs", upload.none(), verifyJWT, adminController.getBlockedStaffMembers);
router.get("/get-staff/:staffId", upload.none(), verifyJWT, adminController.getStaffById);
router.post("/edit-staff/:staffId", upload.none(), verifyJWT, adminController.editStaffMember);
router.post("/search-all-staff", upload.none(), verifyJWT, adminController.searchAllStaffByTerm);
router.post("/search-active-staff", upload.none(), verifyJWT, adminController.searchActiveStaffByTerm);
router.post("/search-blocked-staff", upload.none(), verifyJWT, adminController.searchBlockedStaffByTerm);

// Job Types

router.post("/add-job-type", upload.none(), verifyJWT, adminController.addJobType);
router.get("/get-job-types", upload.none(), verifyJWT, adminController.getAllJobTypes);
router.get("/get-job-types-dpd", upload.none(), verifyJWT, adminController.getAllJobTypesDpd);
router.get("/get-job-type/:jobId", upload.none(), verifyJWT, adminController.getJobTypeById);
router.post("/edit-job-type/:jobId", upload.none(), verifyJWT, adminController.editJobType);
router.post("/search-job-type", upload.none(), verifyJWT, adminController.searchJobTypeByTerm);

// Material Management

router.post("/add-material", upload.none(), verifyJWT, adminController.addMaterial);
router.get("/get-materials", upload.none(), verifyJWT, adminController.getAllMaterials);
router.get("/get-material/:materialId", upload.none(), verifyJWT, adminController.getMaterialById);
router.post("/edit-material/:materialId", upload.none(), verifyJWT, adminController.editMaterial);
router.post("/search-material", upload.none(), verifyJWT, adminController.searchMaterialByTerm);

// Labor Management

router.post("/add-new-labor", upload.none(), verifyJWT, adminController.addNewLabor);
router.get("/get-labors", upload.none(), verifyJWT, adminController.getAllLabors);
router.get("/get-labors-dpd", upload.none(), verifyJWT, adminController.getAllLaborDpd);
router.get("/get-labor/:laborId", upload.none(), verifyJWT, adminController.getLaborById);
router.post("/edit-labor/:laborId", upload.none(), verifyJWT, adminController.editLabor);
router.post("/search-labor", upload.none(), verifyJWT, adminController.searchLaborByTerm);


// Crew Category Management

router.post("/add-crew-category", upload.none(), verifyJWT, adminController.addCrewCategory);
router.get("/get-crew-categories", upload.none(), verifyJWT, adminController.getAllCrewCategory);
router.get("/get-crew-categories-dpd", upload.none(), verifyJWT, adminController.getAllCrewCategories);
router.get("/get-crew-categories-dpd-admin", upload.none(), verifyJWT, adminController.getAllCrewCategoriesDpd);
router.get("/get-crew-category/:categoryId", upload.none(), verifyJWT, adminController.getCrewCategoryById);
router.post("/edit-crew-category/:categoryId", upload.none(), verifyJWT, adminController.editCrewCategory);

// Crew Management

router.post("/add-crew", upload.none(), verifyJWT, adminController.addCrew);
router.get("/get-crews", upload.none(), verifyJWT, adminController.getAllCrew);
router.get("/get-deleted-crews", upload.none(), verifyJWT, adminController.getAllDeletedCrews);
router.get("/get-crews-dpd", upload.none(), verifyJWT, adminController.getAllCrewsDpdForForeman);
router.get("/get-crews-dpd-project-manager", upload.none(), verifyJWT, adminController.getAllCrewsDpdForProjectManager);
router.get("/get-all-crews-dpd", upload.none(), verifyJWT, adminController.getAllCrewsDpd);
router.get("/get-crew/:crewId", upload.none(), verifyJWT, adminController.getCrewById);
router.post("/edit-crew/:crewId", upload.none(), verifyJWT, adminController.editCrew);
router.post("/search-crew-with-category", upload.none(), verifyJWT, adminController.searchCrewByTerm);
router.post("/search-crew-without-category", upload.none(), verifyJWT, adminController.searchCrewWithoutCategoryByTerm);

// Others
router.post("/get-recent-projects", upload.none(), verifyJWT, adminController.getAllRecentProjects);
router.post("/edit-tax-percent", upload.none(), verifyJWT, adminController.editTaxPercent);
router.get("/get-tax-percent", upload.none(), verifyJWT, adminController.getTaxPercentAdmin);

module.exports = router;