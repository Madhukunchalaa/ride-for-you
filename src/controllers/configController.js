const SystemConfig = require('../models/SystemConfig');

// @GET /api/config
exports.getConfig = async (req, res) => {
  try {
    const configs = await SystemConfig.find();
    const configMap = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });
    
    // Provide defaults if not in DB
    if (!configMap.WEEKLY_RENTAL_AMOUNT) configMap.WEEKLY_RENTAL_AMOUNT = 2000;
    
    res.status(200).json({ success: true, data: configMap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/config
exports.updateConfig = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Key and Value are required' });
    }

    let config = await SystemConfig.findOne({ key: key.toUpperCase() });
    
    if (config) {
      config.value = value;
      if (description) config.description = description;
      config.updatedBy = 'admin';
      await config.save();
    } else {
      config = await SystemConfig.create({
        key: key.toUpperCase(),
        value,
        description,
        updatedBy: 'admin'
      });
    }

    res.status(200).json({ success: true, message: 'Configuration updated', data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
