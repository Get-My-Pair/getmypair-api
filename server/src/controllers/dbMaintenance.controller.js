/**
 * Darkworkstore master admin — MongoDB maintenance APIs
 */

const dbMaintenance = require('../services/dbMaintenance.service');
const { success, error: errorResponse } = require('../utils/response');

const adminEmail = (req) => req.adminMaster?.email || 'unknown';

const overview = async (req, res) => {
  try {
    const data = await dbMaintenance.getOverview();
    return success(res, 'Database overview', data);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to load database overview', err.statusCode || 500);
  }
};

const clearCollection = async (req, res) => {
  try {
    const { collection, confirmPhrase } = req.body;
    const data = await dbMaintenance.deleteCollection(collection, confirmPhrase, adminEmail(req));
    return success(res, `Cleared ${data.label}`, data);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to clear collection', err.statusCode || 500);
  }
};

const clearGroup = async (req, res) => {
  try {
    const { group, confirmPhrase } = req.body;
    const data = await dbMaintenance.deleteGroup(group, confirmPhrase, adminEmail(req));
    return success(res, `Cleared group: ${data.label}`, data);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to clear group', err.statusCode || 500);
  }
};

const clearAll = async (req, res) => {
  try {
    const { confirmPhrase } = req.body;
    const data = await dbMaintenance.deleteAllData(confirmPhrase, adminEmail(req));
    return success(res, 'All application data cleared (master admin login preserved)', data);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to clear database', err.statusCode || 500);
  }
};

module.exports = {
  overview,
  clearCollection,
  clearGroup,
  clearAll,
};
