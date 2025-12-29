const express = require("express");
const router = express.Router();

// Route to render the login page
router.get("/login", (req, res) => {
  res.render("admin/login", { title: "Admin Login" });
});

router.get("/dashboard", (req, res) => {
    res.render("admin/dashboard", { title: "Admin Login" });
  });


module.exports = router;