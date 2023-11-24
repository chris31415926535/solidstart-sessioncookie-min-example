import { createCookieSessionStorage, json } from "solid-start";

// A string that we'll use below in createCookieSessionStorage() to sign/unsign the cookie string.
const sessionSecret = "ChOoO-ChooOoooOOOooOOooO-chooOOOose a BettER SEcRET!!";


export const storage = createCookieSessionStorage({
    cookie: {
        name: "solidstart_sample_session",
        secure: true,
        secrets: [sessionSecret],
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60, // valid for one hour
        httpOnly: true
    }
});


// generic function to set a cookie value
export const setCookieValue = async (request: Request, field: string, value: string) => {

    const session = await storage.getSession(request.headers.get("Cookie"));
    session.set(field, value);
    const newCookie = await storage.commitSession(session);
    return json({ newCookie }, {
        headers: {
            "Set-Cookie": newCookie
        }
    });
}