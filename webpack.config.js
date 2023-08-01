const path = require("path");

module.exports = {
  mode: "production",
  context: path.resolve(__dirname, "scripts"),
  entry: {
    index: "./index.js",
    login: "./login.js",
    oauth: "./oauth.js",
    rename: "./rename.js",
    admin: "./admin.js",
  },
  output: {
    path: path.resolve(__dirname, "scripts"),
    filename: "[name].bundle.js",
  },
};
