const Profile = require("../models/profile.model");
const utils = require("../helpers/utils");

exports.FindProfieById = async function (req, res) {
  if (req.params.id) {
    const id = req.params.id;
    console.log(id);
    if (id) {
      const profile = await Profile.FindById(id);
      if (!profile) {
        return utils.send500({ error: true, message: "not found" });
      } else {
        return res.json({ data: profile, error: false });
      }
    } else {
      return utils.send500({ error: true, message: "not found" });
    }
  }
};

exports.getNotification = async function (req, res) {
  const { id } = req.params;
  const data = await Profile.getNotification(id);
  return res.send({
    error: false,
    data: data,
  });
};
