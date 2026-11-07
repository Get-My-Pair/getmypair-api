/**
 * Repairshops master admin — MongoDB maintenance APIs
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

function readConfirm(body = {}) {
  return String(body.confirmPhrase || body.confirm || '').trim();
}

const clearCollection = async (req, res) => {
  try {
    const { collection } = req.body;
    const data = await dbMaintenance.deleteCollection(
      collection,
      readConfirm(req.body),
      adminEmail(req)
    );
    return success(res, `Cleared ${data.label}`, data);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to clear collection', err.statusCode || 500);
  }
};

const clearGroup = async (req, res) => {
  try {
    const { group } = req.body;
    const data = await dbMaintenance.deleteGroup(group, readConfirm(req.body), adminEmail(req));
    return success(res, `Cleared group: ${data.label}`, data);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to clear group', err.statusCode || 500);
  }
};

const clearAll = async (req, res) => {
  try {
    const data = await dbMaintenance.deleteAllData(readConfirm(req.body), adminEmail(req));
    return success(
      res,
      `Cleared ${data.totalDeleted} documents. Kept protected: adminmasters, deliveryprofiles, careserviceproblems, hubsettings, articlecategories, roles, sequencecounters.`,
      data
    );
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
