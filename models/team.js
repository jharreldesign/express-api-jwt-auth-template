const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
