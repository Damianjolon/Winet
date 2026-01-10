const app = require("../backend/src/index.js");

module.exports = (req, res) => {
  req.url = req.url.replace(/^\/api(?=\/|$)/, "") || "/";
  return app(req, res);
};
