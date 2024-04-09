"use strict";
const { executeQuery } = require("../helpers/utils");

var Profile = function (profile) {
  this.UserName = profile.Username;
  this.FirstName = profile.FirstName;
  this.LastName = profile.LastName;
  this.Address = profile.Address;
  this.Country = profile.Country;
  this.City = profile.City;
  this.County = profile.County;
  this.State = profile.State;
  this.Zip = profile.Zip;
  this.UserID = profile.UserID;
  this.DateofBirth = profile.DateofBirth;
  this.Gender = profile.Gender;
  this.MobileNo = profile.MobileNo;
  this.AccountType = profile?.AccountType || "I";
  this.Business_NP_TypeID = profile.Business_NP_TypeID || 0;
  this.CoverPicName = profile.CoverPicName;
  this.ProfilePicName = profile.ProfilePicName;
  this.IsActivated = profile.IsActive;
  this.CreatedOn = new Date();
};

Profile.FindById = async function (profileId) {
  const query = `SELECT ID as Id,
    FirstName,
    LastName,
    UserID,
    MobileNo,
    Gender,
    DateofBirth,
    Address,
    City,
    State,
    Zip,
    Country,
    Business_NP_TypeID,
    CoverPicName,
    IsActivated,
    Username,
    ProfilePicName,
    EmailVerified,
    CreatedOn,
    AccountType,
    MediaApproved,
    County
  FROM profile WHERE ID=?`;
  const values = profileId;
  let profile = await executeQuery(query, values);
  const query1 =
    "select c.channelId from channelAdmins as c left join profile as p on p.ID = c.profileId where c.profileId = p.ID and p.UserID = ?;";
  const value1 = [profile[0]?.UserID];
  const channelId = await executeQuery(query1, value1);
  profile[0]["channelId"] = channelId[0]?.channelId;
  console.log("test", profile);
  return profile;
};

Profile.getNotification = async function (id) {
  if (id) {
    const query = "select * from notifications where id = ?";
    const values = [id];
    const notificationData = await executeQuery(query, values);
    return notificationData;
  } else {
    return { error: "data not found" };
  }
};
module.exports = Profile;
