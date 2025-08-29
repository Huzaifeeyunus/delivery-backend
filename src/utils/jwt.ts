import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};


 

export const signToken = (payload: any, expiresIn = "7d") =>
  jwt.sign(payload, process.env.JWT_SECRET!);

export const verifyLoginToken = (token: string) =>
  jwt.verify(token, process.env.JWT_SECRET!);
