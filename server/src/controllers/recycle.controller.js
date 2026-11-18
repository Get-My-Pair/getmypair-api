const { RECYCLE_SLIDES } = require('../data/recycleSlides');
const { success } = require('../utils/response');

const listSlides = (req, res) =>
  success(res, 'Recycle process', { slides: RECYCLE_SLIDES });

module.exports = { listSlides };
