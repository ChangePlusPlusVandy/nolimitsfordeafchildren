import { Service } from "typedi";

export interface IAuthService {
  login(input: { email: string; password: string }): Promise<{ accessToken: string; refreshToken: string }>
  refresh(input: { refreshToken: string }): Promise<{ accessToken: string }>
  logout(): Promise<void>
}

@Service()
export class AuthService implements IAuthService {
  async login(_input: { email: string; password: string }): Promise<{ accessToken: string; refreshToken: string }> {
    // TODO: implement with real auth provider
    return { accessToken: "dev-access-token", refreshToken: "dev-refresh-token" }
  }

  async refresh(_input: { refreshToken: string }): Promise<{ accessToken: string }> {
    // TODO: implement with token rotation
    return { accessToken: "dev-access-token" }
  }

  async logout(): Promise<void> {
    return
  }
}

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