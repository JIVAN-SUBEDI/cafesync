const express= require("express");
const router = express.Router();

// Import controllers
const staffController = require("../controllers/staffController.js");

const {protectStaff,protectHotelAdmin} = require("../middleware/auth.js");
const {validate,staffLoginSchema} = require('../middleware/dashboardValidation.js')





router.post("/staff/login", validate(staffLoginSchema), staffController.staffLogin);
router.post("/staff/change-password", protectHotelAdmin, staffController.changeStaffPassword);
router.post('/staff/logout', protectStaff, staffController.logoutStaff);
router.get('/staff/me', protectHotelAdmin, staffController.getCurrentStaff);
router.post('/staff/refresh', staffController.refreshStaffToken);



module.exports = router;
