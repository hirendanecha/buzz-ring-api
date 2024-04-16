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
          console.log("old-user", oldUser);
          if (!oldUser) {
            const newUser = await User.addSites(data);
            console.log("newUser", newUser);
          }
          res.status(200).send({
            message: "Authorized User",
            success: true,
            registerDeviceId: deviceId,
            data: response?.data?.data[0],
            domain: domain,
          });
        })
        .catch((error) => {
          // Handle error
          console.log(error);
          res.status(error.response.status).send({
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
    for (const token of users) {
      const message = {
        data: { title: "call notification", body: JSON.stringify(messageData) },
        token: token.fcmToken,
      };
      admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
          res.status(error.errorCode).send("Error sending notification");
        });
      // }
    }
    console.log("users", users);
    // for (const item of users) {
    // const token = item.fcmToken;

    res.send("Notification sent");
  } catch (error) {
    console.log(error);
    res.status(error.errorCode).send(error);
  }

  // return res.send({
  //   error: false,
  //   data: data,
  // });
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
