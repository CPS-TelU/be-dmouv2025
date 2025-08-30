import { prisma } from "../config/database.js";
import { io } from "./socket.service.js";

/**
 * Mengambil semua perangkat dari database.
 */
export const getAllDevices = async () => {
  const devices = await prisma.device.findMany({
    include: {
      setting: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return devices;
};

/**
 * @param {object} deviceData - Objek yang berisi uniqueId.
 * @param {string} deviceData.uniqueId - ID unik dari perangkat fisik.
 */
export const onboardNewDevices = async (deviceData) => {
  const { uniqueId } = deviceData;

  const existingDevice = await prisma.device.findFirst({
    where: { uniqueId },
  });

  if (existingDevice) {
    console.log(`Device with Unique ID ${uniqueId} already exists.`);
    const error = new Error(
      `Device with ID ${uniqueId} is already registered.`
    );
    error.status = 409;
    throw error;
  }

  const newDevices = await prisma.$transaction(async (tx) => {
    const lampDevice = await tx.device.create({
      data: {
        uniqueId: uniqueId,
        deviceName: `IoT Lamp ${uniqueId}`,
        deviceTypes: ["lamp"],
        setting: {
          create: {
            autoModeEnabled: true,
            scheduleEnabled: false,
          },
        },
      },
    });

    const fanDevice = await tx.device.create({
      data: {
        uniqueId: uniqueId,
        deviceName: `IoT Fan ${uniqueId}`,
        deviceTypes: ["fan"],
        setting: {
          create: {
            autoModeEnabled: true,
            scheduleEnabled: false,
          },
        },
      },
    });

    return await tx.device.findMany({
      where: { uniqueId: uniqueId },
      include: { setting: true },
    });
  });

  newDevices.forEach((device) => {
    io?.emit("device_added", device);
  });

  return { isNew: true, devices: newDevices };
};
