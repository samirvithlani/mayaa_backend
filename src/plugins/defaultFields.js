// plugins/defaultFields.js

module.exports = function defaultFields(schema) {
  // Add status field
  schema.add({
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active"
    }
  });

  // Add timestamps
  schema.set("timestamps", true);
};
