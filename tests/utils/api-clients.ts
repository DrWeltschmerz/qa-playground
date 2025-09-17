import type { APIRequestContext } from "@playwright/test";

export class AiClient {
  constructor(private ctx: APIRequestContext, private baseURL: string) {}

  async complete(data: { prompt: string; model: string }) {
    return this.ctx.post(`${this.baseURL}/v1/ai/complete`, { data });
  }
}

export class UsersClient {
  constructor(private ctx: APIRequestContext, private baseURL: string) {}

  register(data: { email: string; username: string; password: string }) {
    return this.ctx.post(`${this.baseURL}/register`, { data });
  }
  login(data: { email: string; password: string }) {
    return this.ctx.post(`${this.baseURL}/login`, { data });
  }
  profile() {
    return this.ctx.get(`${this.baseURL}/user/profile`);
  }
}
