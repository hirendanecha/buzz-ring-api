"use strict";
var db = require("../../config/db.config");
require("../common/common")();
const { executeQuery } = require("../helpers/utils");

var User = function (user) {
  this.Email = user.Email;
  this.Username = user.Username;
  this.Password = user.Password;
  this.IsActive = user.IsActive || "N";
  this.IsAdmin = user.IsAdmin || "N";
  this.PartnerId = user.PartnerId;
  this.IsSuspended = user.IsSuspended || "N";
  this.FirstName = user.FirstName;
  this.LastName = user.LastName;
  this.Address = user.Address;
  this.Country = user.Country;
  this.Zip = user.Zip;
  this.State = user.State;
  this.City = user.City;
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

User.findById = async function (user_id) {
  const query = `SELECT u.Id,
  u.Email,
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
  u.Username,
  u.AccountType,
  u.IsSuspended,
  p.ID as profileId
FROM users as u left join profile as p on p.UserID = u.Id WHERE u.Id = ? `;
  const values = [user_id];
  const user = await executeQuery(query, values);
  return user;
};

User.findByUsernameAndEmail = async function (email) {
  const query = `SELECT * from users WHERE Email = ? or Username = ?`;
  const values = [email, email];
  const user = await executeQuery(query, values);
  console.log(user);
  return user[0];
};

module.exports = User;
