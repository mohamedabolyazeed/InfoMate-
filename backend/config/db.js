const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://mohamedaboelyazeed920:H1iPPlJG9GeOzcwN@cluster0.lbwsy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10s
  maxPoolSize: 10,
  minPoolSize: 5,
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("InfoMate");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Don't exit the process, let the application handle the error
    throw error;
  }
}

// Helper functions for user operations
const userHelpers = {
  async createUser(userData) {
    const db = await connectDB();
    const users = db.collection("users");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date(),
      isActive: true,
      role: userData.role || "user",
      lastLogin: null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    };

    const result = await users.insertOne(user);
    return result;
  },

  async findUserByEmail(email) {
    const db = await connectDB();
    const users = db.collection("users");
    return await users.findOne({ email });
  },

  async findUserById(id) {
    const db = await connectDB();
    const users = db.collection("users");
    return await users.findOne({ _id: id });
  },

  async updateUser(id, updateData) {
    const db = await connectDB();
    const users = db.collection("users");
    return await users.updateOne({ _id: id }, { $set: updateData });
  },

  async findUserByResetToken(token) {
    const db = await connectDB();
    const users = db.collection("users");
    return await users.findOne({
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
    const db = await connectDB();
    const dataCollection = db.collection("data");

    const newData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await dataCollection.insertOne(newData);
  },

  async findData(query = {}) {
    const db = await connectDB();
    const dataCollection = db.collection("data");
    return await dataCollection.find(query).toArray();
  },

  async findDataById(id) {
    const db = await connectDB();
    const dataCollection = db.collection("data");
    return await dataCollection.findOne({ _id: id });
  },

  async updateData(id, updateData) {
    const db = await connectDB();
    const dataCollection = db.collection("data");
    return await dataCollection.updateOne(
      { _id: id },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );
  },

  async deleteData(id) {
    const db = await connectDB();
    const dataCollection = db.collection("data");
    return await dataCollection.deleteOne({ _id: id });
  },
};

// Initialize collections with indexes
async function initializeCollections() {
  const db = await connectDB();

  // Users collection indexes
  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ resetPasswordToken: 1 });

  // Data collection indexes
  const data = db.collection("data");
  await data.createIndex({ createdAt: 1 });
  await data.createIndex({ updatedAt: 1 });
}

// Initialize collections when the application starts
initializeCollections().catch(console.error);

module.exports = { connectDB, userHelpers, dataHelpers };
