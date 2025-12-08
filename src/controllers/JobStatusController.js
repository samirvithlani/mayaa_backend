const productImportQueue = require("../queues/productImportQueue");

const getJobStatus = async (req, res) => {
  const { jobId } = req.params;

  const job = await productImportQueue.getJob(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const state = await job.getState();
  const progress = job.progress;

  res.json({ jobId, state, progress });
};

module.exports = { getJobStatus };
