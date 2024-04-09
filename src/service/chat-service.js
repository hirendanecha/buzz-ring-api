const { executeQuery } = require("../helpers/utils");

exports.createNotification = async function (data) {
  return await createNotification(data);
};

exports.startCall = async function (data) {
  return await startCall(data);
};

exports.declineCall = async function (data) {
  return await declineCall(data);
};

exports.pickUpCall = async function (data) {
  return await pickUpCall(data);
};

exports.getRoomsIds = async function (data) {
  return await getRoomsIds(data);
};

const createNotification = async function (params) {
  try {
    const {
      notificationToProfileId,
      roomId,
      groupId,
      notificationByProfileId,
      actionType,
      msg,
    } = params;
    const query =
      "SELECT ID,ProfilePicName, Username, FirstName,LastName from profile where ID = ?";
    const values = [notificationByProfileId];
    const userData = await executeQuery(query, values);
    let desc = `${userData[0]?.Username || userData[0]?.FirstName} ${msg}`;

    const data = {
      notificationToProfileId: notificationToProfileId || null,
      roomId: roomId || null,
      groupId: groupId || null,
      notificationByProfileId: notificationByProfileId || null,
      actionType: actionType,
      notificationDesc: desc,
    };
    if (data.notificationByProfileId !== data.notificationToProfileId) {
      const query1 = "insert into notifications set ?";
      const values1 = [data];
      const notificationData = await executeQuery(query1, values1);
      return { ...data, id: notificationData.insertId };
      // return true;
    }
    // else {
    //   // const find =
    //   //   "select * from notifications where roomId= ? and notificationByProfileId = ?";
    //   // const value = [data.roomId, data.notificationByProfileId];
    //   // const oldData = await executeQuery(find, value);
    //   // if (oldData.length) {
    //   //   return oldData[0];
    //   // } else {
    //   // }
    //   const query1 = "insert into notifications set ?";
    //   const values1 = [data];
    //   const notificationData = await executeQuery(query1, values1);
    //   return { ...data, id: notificationData.insertId };
    // }
  } catch (error) {
    return error;
  }
};

const startCall = async function (params) {
  try {
    if (params) {
      if (params?.roomId) {
        const data = {
          notificationToProfileId: params?.notificationToProfileId || null,
          roomId: params?.roomId,
          notificationByProfileId: params?.notificationByProfileId || null,
          actionType: "VC",
          msg: "incoming call...",
        };
        const notification = await createNotification(data);
        notification["link"] = params?.link;
        const query = `select p.Username,p.FirstName,p.LastName,p.ProfilePicName from profile as p where p.ID = ${params?.notificationByProfileId}`;
        const [profile] = await executeQuery(query);
        notification["Username"] = profile?.Username;
        notification["ProfilePicName"] = profile?.ProfilePicName;
        return { notification };
      } else {
        const data = {
          notificationToProfileId: params?.notificationToProfileId || null,
          groupId: params?.groupId,
          notificationByProfileId: params?.notificationByProfileId || null,
          actionType: "VC",
          msg: "incoming call...",
        };
        const notification = await createNotification(data);
        notification["link"] = params?.link;
        const query = `select p.Username,p.FirstName,p.LastName,p.ProfilePicName from profile as p where p.ID = ${params?.notificationByProfileId}`;
        const [profile] = await executeQuery(query);
        notification["Username"] = profile?.Username;
        notification["ProfilePicName"] = profile?.ProfilePicName;
        return { notification };
      }
    }
  } catch (error) {
    return error;
  }
};

const declineCall = async function (params) {
  try {
    if (params) {
      const data = {
        notificationToProfileId: params?.notificationToProfileId || null,
        roomId: params?.roomId,
        notificationByProfileId: params?.notificationByProfileId || null,
        actionType: "DC",
        msg: "Declined call..",
      };
      const notification = await createNotification(data);
      return notification;
    }
  } catch (error) {
    return error;
  }
};

const pickUpCall = async function (params) {
  try {
    if (params) {
      const data = {
        notificationToProfileId: params?.notificationToProfileId || null,
        roomId: params?.roomId,
        groupId: params?.groupId,
        notificationByProfileId: params?.notificationByProfileId || null,
        actionType: "SC",
        msg: "call start...",
      };
      const notification = await createNotification(data);
      notification["link"] = params?.link;
      return notification;
    }
  } catch (error) {
    return error;
  }
};
const getRoomsIds = async function (id) {
  try {
    const query = `select id as roomId from chatRooms where profileId1 = ${id} or profileId2 = ${id}`;
    const query1 = `select groupId from groupMembers where profileId = ${id}`;
    const roomsIds = await executeQuery(query);
    const groupsIds = await executeQuery(query1);

    const chatData = { roomsIds, groupsIds };
    return chatData;
  } catch (error) {
    return error;
  }
};
