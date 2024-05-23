"use strict";

const User = require("../models/user.model");
const environments = require("../environments/environment");
const jwt = require("jsonwebtoken");
const authorize = require("../middleware/authorize");
const { Encrypt } = require("../helpers/cryptography");
const axios = require("axios");
const admin = require("firebase-admin");
exports.login = async function (req, res) {
  const { email, password } = req.body;
  const user = await User.findByUsernameAndEmail(email);
  if (user) {
    const encryptedPassword = Encrypt(password);
    const isMatch = encryptedPassword === user.Password;
    console.log(isMatch);
    if (isMatch) {
      User.login(email, user.Id, function (err, token) {
        if (err) {
          console.log(err);
          if (err?.errorCode) {
            return res.status(400).send({
              error: true,
              message: err?.message,
              errorCode: err?.errorCode,
            });
          }
          return res.status(400).send({ error: true, message: err });
        } else {
          res.cookie("auth-user", token, {
            secure: true,
            sameSite: "none",
            domain: environments.domain,
          });
          return res.json(token);
        }
      });
    } else {
      return res.status(400).send({
        error: true,
        message: "Password is incorrect!",
      });
    }
  } else {
    return res.status(400).send({
      error: true,
      message: "Invalid Email and Password. Kindly try again!",
    });
  }
};

exports.getToken = async function (req, res) {
  const data = req?.cookies;
  console.log(data["auth-user"]);
  if (data) {
    const token = data["auth-user"];

    if (token) {
      return res.json(token);
    } else {
      return res.status(400).json({ message: "" });
    }
  } else {
    return res.status(400).json({ message: "" });
  }
};

exports.findById = async function (req, res) {
  const user = await User.findById(req.params.id);
  if (user) {
    res.send(user);
  } else {
    res.status(400).send({
      error: true,
      message: "User not found",
    });
  }
};

exports.logout = function (req, res) {
  console.log("innn==>");
  const token = req.headers.authorization.split(" ")[1];
  authorize.setTokenInList(token);
  res.clearCookie("auth-user", {
    sameSite: "none",
    secure: true,
    domain: environments.domain,
  });
  return res.status(200).json({ message: "logout successfully" });
};

exports.verifyToken = async function (req, res) {
  try {
    const { token, domain, deviceId } = req.body;
    // const token = req.params.token;
    console.log(domain, token);
    const decoded = jwt.verify(token, environments.JWT_SECRET_KEY);
    console.log(decoded.user);
    if (decoded.user) {
      const apiUrl = `https://dev-api.${domain}/api/v1/customers/profile/${decoded.user.id}`;
      console.log(apiUrl);
      axios
        .get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(async (response) => {
          // Handle successful response
          const data = {
            deviceId: deviceId,
            profileId: decoded.user.id,
            domainName: domain,
          };
          const oldUser = await User.findById(
            decoded.user.id,
            domain,
            deviceId
          );
          const userData = response?.data?.data[0];
          userData["token"] = token;
          userData["domain"] = domain;
          console.log("old-user", oldUser);
          if (!oldUser) {
            userData["scanId"] = await User.addSites(data);
          } else {
            userData["scanId"] = oldUser.id;
            // res.status(200).send({
            //   message: "User already connected with other device!",
            //   success: false,
            // });
          }
          res.status(200).send({
            message: "Authorized User",
            success: true,
            data: userData,
          });
        })
        .catch((error) => {
          // Handle error
          console.log(error);
          res.status(500).send({
            message: error.response.statusText,
            success: false,
          });
        });
    } else {
      res
        .status(401)
        .json({ message: "Unauthorized Token", verifiedToken: false });
    }
  } catch (err) {
    res.status(401).json({ message: "Invalid token", verifiedToken: false });
  }
};

exports.callNotification = async function (req, res) {
  try {
    const messageData = req.body;
    console.log(messageData);
    const users = await User.findFcmTokenById(
      messageData.notificationToProfileId,
      messageData.domain
    );
    let response = [];
    // for (const token of users) {
    const promises = users.map(async (element) => {
      console.log("token", element.fcmToken);
      const message = {
        data: { title: "call notification", body: JSON.stringify(messageData) },
        token: element?.fcmToken,
        android: {
          priority: "high",
          // content_available: true, // Android-specific
        },
        apns: {
          payload: {
            aps: {
              "mutable-content": 1,
              contentAvailable: true, // iOS-specific
            },
          },
        },
      };
      try {
        const resMessage = await admin.messaging().send(message);
        console.log("Successfully sent message:", resMessage);
        return resMessage;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    });
    try {
      const responses = await Promise.all(promises);
      res.send(responses);
    } catch (error) {
      console.error("Error sending messages:", error);
      throw error;
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};
exports.groupCallNotification = async function (req, res) {
  try {
    const messageData = req.body;
    console.log(messageData);
    let responseList = [];
    messageData?.notificationToProfileIds.forEach(async (profileId) => {
      console.log("profileId", profileId);
      const users = await User.findFcmTokenById(profileId, messageData.domain);
      // for (const token of users) {
      console.log(users);
      const promises = users.map(async (element) => {
        console.log("token", element.fcmToken);
        const message = {
          data: {
            title: "call notification",
            body: JSON.stringify(messageData),
          },
          token: element?.fcmToken,
          android: {
            priority: "high",
            // content_available: true, // Android-specific
          },
          apns: {
            payload: {
              aps: {
                "mutable-content": 1,
                contentAvailable: true, // iOS-specific
              },
            },
          },
        };
        try {
          const resMessage = await admin.messaging().send(message);
          console.log("Successfully sent message:", resMessage);
          return resMessage;
        } catch (error) {
          console.error("Error sending message:", error);
          throw error;
        }
      });
      try {
        const responses = await Promise.all(promises);
        console.log(responses);
        responseList.push(responses);
      } catch (error) {
        console.error("Error sending messages:", error);
        throw error;
      }
    });

    if (responseList.length) {
    } else {
      res.send([]);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.registerDevice = async function (req, res) {
  try {
    const data = req.body;
    const id = await User.registerDevice(data);
    return res.send({
      error: false,
      registerDeviceId: id,
    });
  } catch (error) {
    res.status(error.errorCode).send(error);
  }
};

exports.deleteProfile = async function (req, res) {
  try {
    const { id } = req.params;
    const data = await User.deleteProfile(id);
    return res.send({
      error: false,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.send({
      error: true,
      error,
    });
  }
};
