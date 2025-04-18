const express = require('express')
const router = express.Router();


// ========================== ROUTE GIỚI THIỆU TRANG WEB ==========================
router.get('/about', (req, res) => {
    res.render('about');
});

module.exports = router;
