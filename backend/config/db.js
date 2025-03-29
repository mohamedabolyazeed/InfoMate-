const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Data = require("../models/Data");

// Helper functions for user operations
const userHelpers = {
  async createUser(userData) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = new User({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || "user",
    });

    return await user.save();
  },

  async findUserByEmail(email) {
    return await User.findOne({ email });
  },

  async findUserById(id) {
    return await User.findById(id);
  },

  async updateUser(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  },

  async findUserByResetToken(token) {
    return await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
  },

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  },
};

// Helper functions for data operations
const dataHelpers = {
  async createData(data) {
    const newData = new Data({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await newData.save();
  },

  async findData(query = {}) {
    return await Data.find(query);
  },

  async findDataById(id) {
    return await Data.findById(id);
  },

  async updateData(id, updateData) {
    return await Data.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true }
    );
  },

  async deleteData(id) {
    return await Data.findByIdAndDelete(id);
  },
};

module.exports = { userHelpers, dataHelpers };
