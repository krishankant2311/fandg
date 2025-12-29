const multer = require('multer')

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public')

    },
    filename: (req, file, cb) => {

        cb(null, `${Date.now()}-${file.originalname}`)
    }
});


const upload = multer({ storage: storage,limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = upload;