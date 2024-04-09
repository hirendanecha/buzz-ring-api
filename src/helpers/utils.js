const environment = require("../environments/environment");
const email = require("./email");
const db = require("../../config/db.config");

exports.send404 = function (res, err) {
  res.status(404).send({ error: true, message: err });
};

exports.send500 = function (res, err) {
  res.status(500).send({ error: true, message: err });
};

exports.notificationMail = async (userData) => {
  let name = userData?.userName || userData.firstName;
  let msg = `You were tagged in ${userData.senderUsername}'s ${userData.type}.`;
  let redirectUrl = `${environment.FRONTEND_URL}post/${userData.postId}`;

  const mailObj = {
    email: userData.email,
    subject: "Buzz Ring notification",
    root: "../email-templates/notification.ejs",
    templateData: { name: name, msg: msg, url: redirectUrl },
  };

  await email.sendMail(mailObj);
  return;
};
  
exports.executeQuery = async (query, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, function (err, result) {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
};
