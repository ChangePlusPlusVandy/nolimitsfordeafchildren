// import { Service } from "typedi";

// export interface IAuthService {
//   verifyAndDecodeToken(token: string): Promise<{ sub: string }>
// }

// @Service()
// export class AuthService implements IAuthService {
//   async verifyAndDecodeToken(token: string): Promise<{ sub: string }> {
//     const decoded = await jwt.verify(token, process.env.JWT_SECRET);
//     return { sub: decoded.sub };
//   }
// }