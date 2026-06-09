/**
 * Darkworkstore admin — payment module APIs
 */
const darkstorePayment = require('../services/darkstorePayment.service');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const handleError = (res, err) => {
  const code = err.statusCode || 500;
  if (code >= 500) logger.error(err.message);
  return errorResponse(res, err.message, code);
};

const costApprovalJobs = async (req, res) => {
  try {
    const data = await darkstorePayment.listCostApprovalJobs({
      darkStoreId: req.query.darkStoreId,
      page: req.query.page,
      limit: req.query.limit,
    });
    return success(res, 'Cost approval jobs retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const updateActualCost = async (req, res) => {
  try {
    const data = await darkstorePayment.updateActualCost(
      req.params.serviceRequestId,
      req.body.actualCost,
      req.adminMaster._id,
      req
    );
    return success(res, 'Actual cost updated — awaiting user approval', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const paymentStatusList = async (req, res) => {
  try {
    const data = await darkstorePayment.listPaymentStatus({
      darkStoreId: req.query.darkStoreId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });
    return success(res, 'Payment status list retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const paymentStatusByOrder = async (req, res) => {
  try {
    const data = await darkstorePayment.getPaymentStatusByOrder(req.params.orderId);
    return success(res, 'Payment status retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const paidJobs = async (req, res) => {
  try {
    const data = await darkstorePayment.listPaidJobs({
      darkStoreId: req.query.darkStoreId,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page,
      limit: req.query.limit,
    });
    return success(res, 'Paid jobs retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const unpaidJobs = async (req, res) => {
  try {
    const data = await darkstorePayment.listUnpaidJobs({
      darkStoreId: req.query.darkStoreId,
      page: req.query.page,
      limit: req.query.limit,
    });
    return success(res, 'Unpaid jobs retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const revenueDashboard = async (req, res) => {
  try {
    const data = await darkstorePayment.getRevenueDashboard({
      darkStoreId: req.query.darkStoreId,
      from: req.query.from,
      to: req.query.to,
    });
    return success(res, 'Revenue dashboard retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const transactions = async (req, res) => {
  try {
    const data = await darkstorePayment.listTransactions({
      darkStoreId: req.query.darkStoreId,
      status: req.query.status,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page,
      limit: req.query.limit,
    });
    return success(res, 'Transactions retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const transactionDetails = async (req, res) => {
  try {
    const data = await darkstorePayment.getTransactionDetails(req.params.paymentId);
    return success(res, 'Transaction details retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const servicePaymentHistory = async (req, res) => {
  try {
    const data = await darkstorePayment.getServicePaymentHistory(req.params.serviceRequestId);
    return success(res, 'Service payment history retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const settlements = async (req, res) => {
  try {
    const data = await darkstorePayment.listSettlements({
      darkStoreId: req.query.darkStoreId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });
    return success(res, 'Settlements retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const processSettlement = async (req, res) => {
  try {
    const data = await darkstorePayment.processDarkstoreSettlement(
      req.params.settlementId,
      req.adminMaster._id,
      req
    );
    return success(res, 'Settlement processed', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const monthlyReport = async (req, res) => {
  try {
    const data = await darkstorePayment.getMonthlyReport({
      darkStoreId: req.query.darkStoreId,
      year: req.query.year,
      month: req.query.month,
    });
    return success(res, 'Monthly payment report generated', data);
  } catch (err) {
    return handleError(res, err);
  }
};

const paymentNotifications = async (req, res) => {
  try {
    const data = await darkstorePayment.listPaymentNotifications({
      darkStoreId: req.query.darkStoreId,
      page: req.query.page,
      limit: req.query.limit,
    });
    return success(res, 'Payment notifications retrieved', data);
  } catch (err) {
    return handleError(res, err);
  }
};

module.exports = {
  costApprovalJobs,
  updateActualCost,
  paymentStatusList,
  paymentStatusByOrder,
  paidJobs,
  unpaidJobs,
  revenueDashboard,
  transactions,
  transactionDetails,
  servicePaymentHistory,
  settlements,
  processSettlement,
  monthlyReport,
  paymentNotifications,
};
