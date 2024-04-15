"use strict";
var db = require("../../config/db.config");
require("../common/common")();
const { executeQuery } = require("../helpers/utils");

var User = function (user) {
  this.deviceId = user.deviceId;
  this.fcmToken = user.fcmToken;
};

User.login = function (email, Id, result) {
  db.query(
    `SELECT u.Id,
            u.Email,
            u.Username,
            u.IsActive,
            u.DateCreation,
            u.IsAdmin,
            u.FirstName,
            u.LastName,
            u.Address,
            u.Country,
            u.City,
            u.State,
            u.Zip,
            u.IsSuspended,
            u.AccountType,
            p.ID as profileId,
            p.CoverPicName,
            p.ProfilePicName,
            p.MobileNo,
            p.MediaApproved,
            p.ChannelType,
            p.DefaultUniqueLink,
            p.UniqueLink,
            p.AccountType,
            cm.communityId
     FROM users as u left join profile as p on p.UserID = u.Id AND p.AccountType in ('I','M') left join communityMembers as cm on cm.profileId = p.ID WHERE u.Email = ? OR u.Username = ? AND u.Id = ?`,
    [email, email, Id],
    async function (err, res) {
      if (err) {
        console.log("error login", err);
        return result(err, null);
      } else {
        const user = res[0];
        console.log(user, "user===>");
        if (user?.IsActive === "N") {
          return result(
            {
              message:
                "Please check your email and click the activation link to activate your account.",
              errorCode: "not_verified",
            },
            null
          );
        }
        if (user?.IsSuspended === "Y") {
          return result(
            {
              message: "This user has been suspended by admin",
              errorCode: "not_verified",
            },
            null
          );
        }

        if (!user) {
          return result(
            {
              message: "Invalid Email and Password. Kindly try again !!!!",
              errorCode: "bad_credentials",
            },
            null
          );
        } else {
          const token = await generateJwtToken(res[0]);
          const query =
            "select c.channelId from channelAdmins as c left join profile as p on p.ID = c.profileId where c.profileId = p.ID and p.UserID = ?;";
          const value = [Id];
          const channelId = await executeQuery(query, value);
          console.log("channelId", channelId);
          user.channelId = channelId[0]?.channelId;
          return result(null, {
            userId: user.Id,
            user: user,
            accessToken: token,
          });
        }
      }
    }
  );
};

User.findById = async function (id, domain, deviceId) {
  const query = `SELECT * from scan_sites as sc left join user as u on u.deviceId = sc.deviceId WHERE sc.profileId = ? and sc.domainName = ? and sc.deviceId = ?`;
  const values = [id, domain, deviceId];
  const [user] = await executeQuery(query, values);
  return user;
};

User.findByUsernameAndEmail = async function (email) {
  const query = `SELECT * from users WHERE Email = ? or Username = ?`;
  const values = [email, email];
  const user = await executeQuery(query, values);
  console.log(user);
  return user[0];
};

User.registerDevice = async function (data) {
  try {
    const query = `
    INSERT INTO user
    SET fcmToken = '${data.fcmToken}',
        deviceId = '${data.deviceId}'
    ON DUPLICATE KEY UPDATE
        deviceId = VALUES(deviceId),
        fcmToken = VALUES(fcmToken);
  `;
    const user = await executeQuery(query);
    if (user.insertId) {
      return user.insertId;
    }
  } catch (error) {
    return error;
  }
};

User.addSites = async function (data) {
  try {
    const query = "insert into scan_sites set ?";
    const values = [data];
    const user = await executeQuery(query, values);
    if (user.insertId) {
      return user.insertId;
    }
  } catch (error) {
    return error;
  }
};

User.findFcmTokenById = async function (id, domain) {
  const query = `SELECT u.fcmToken from scan_sites as sc left join user as u on u.deviceId = sc.deviceId WHERE sc.profileId = ? and sc.domainName = ?`;
  const values = [id, domain];
  const user = await executeQuery(query, values);
  return user;
};

module.exports = User;
