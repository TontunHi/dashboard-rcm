import type { NextConfig } from "next";
import os from "os";

// ดึง IPv4 ทั้งหมดของเครื่องโดยอัตโนมัติ (แม้ IP จะเปลี่ยนจาก DHCP)
const getLocalIpAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = ["localhost", "127.0.0.1", "*.local"];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
};

const nextConfig: NextConfig = {
  allowedDevOrigins: getLocalIpAddresses(),
};

export default nextConfig;
