const express = require("express");
const router = express.Router();

// Route to render the login page
router.get("/login", (req, res) => {
  res.render("office/login", { title: "Admin Login" });
});


module.exports = router;