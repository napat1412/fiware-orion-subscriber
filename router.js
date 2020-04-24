const express = require('express');

const router = express.Router();
const controller = require('./controller');

router.all('*',
  controller.verify_orion_token,
  controller.process_orion,
);

module.exports = router;
