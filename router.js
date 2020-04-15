const express = require('express');

const router = express.Router();
const controller = require('./controller');

router.all('*',
  controller.process_orion,
);

module.exports = router;
