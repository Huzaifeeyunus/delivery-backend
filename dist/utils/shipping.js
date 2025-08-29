"use strict";
// src/utils/shipping.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistanceKm = calculateDistanceKm;
exports.calculateShippingFee = calculateShippingFee;
// src/utils/shipping.ts
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // round to 2 decimal places
}
// Example shipping formula: 10 GHS base + 2 GHS per km
function calculateShippingFee(distance) {
    const base = 10;
    const perKm = 2;
    return base + distance * perKm;
}
/*
function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

export function prevcalculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function prevcalculateShippingFee(
  userLat: number,
  userLon: number
): number {
  const warehouseLat = 5.6037; // Example: Accra latitude
  const warehouseLon = -0.1870; // Example: Accra longitude
  const distanceKm = calculateDistanceKm(
    warehouseLat,
    warehouseLon,
    userLat,
    userLon
  );

  const baseCost = 10; // base GHS for handling
  const ratePerKm = 2; // GHS per km
  return Math.round(baseCost + distanceKm * ratePerKm);
} */
