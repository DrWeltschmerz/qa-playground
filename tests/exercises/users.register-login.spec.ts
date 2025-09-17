import { expect, test } from "@playwright/test";

// Starter skeleton for Exercise #10: Users register → login → me
// See learn/QA-EXERCISES.md#10-users-service-register-→-login

function email() {
  const n = Math.random().toString(36).slice(2, 8);
  return `user_${n}@example.com`;
}

// Skip by default
test.describe.skip("Users: register, login, me", () => {
  test("happy path", async ({ request }) => {
    const e = email();

    const reg = await request.post("/users/register", {
      data: { email: e, username: e.split("@")[0], password: "P@ssw0rd!" },
    });
    expect(reg.ok()).toBeTruthy();

    const login = await request.post("/users/login", {
      data: { username: e, password: "P@ssw0rd!" },
    });
    expect(login.ok()).toBeTruthy();
    const lj = await login.json();
    expect(lj?.token).toBeTruthy();

    const me = await request.get("/users/me", {
      headers: { Authorization: `Bearer ${lj.token}` },
    });
    expect(me.ok()).toBeTruthy();
    const mj = await me.json();
    expect(mj?.email).toBe(e);
  });
});
