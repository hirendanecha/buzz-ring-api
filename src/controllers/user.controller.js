"use strict";

const User = require("../models/user.model");
const environments = require("../environments/environment");
const jwt = require("jsonwebtoken");
const authorize = require("../middleware/authorize");
const { Encrypt } = require("../helpers/cryptography");

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
    const token = req.params.token;
    const decoded = jwt.verify(token, environments.JWT_SECRET_KEY);
    if (decoded.user) {
      res.status(200).send({ message: "Authorized User", verifiedToken: true });
    } else {
      res
        .status(401)
        .json({ message: "Unauthorized Token", verifiedToken: false });
    }
  } catch (err) {
    res.status(401).json({ message: "Invalid token", verifiedToken: false });
  }
};
