
import { onMount } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerAction$, createServerData$, json } from "solid-start/server";
import { storage } from "~/lib/cookies";

// create a routeData() that will expose data saved in our session cookie to the UI.
// Remember the session cookie is an encrypted string containing all our saved values,
// so we need to decrypt it on the server. As such, each UI-exposed data item must be
// created through a createServerData$() function that extracts and unencrypts the data
// stored in the HTML request's "Cookie" header.
export function routeData() {

  // get the value of the cookie field "savedText", which is used to store user-supplied text
  const savedCookieText = createServerData$(async (_, { request }) => {
    const session = await storage.getSession(request.headers.get("Cookie"));

    const savedText = session.get("savedText");

    return (savedText);
  }); // end savedCookieText = createServerData$()

  // get a JSON string containing all data saved in the cookie
  const allCookieDataJson = createServerData$(async (_, { request }) => {
    const session = await storage.getSession(request.headers.get("Cookie"));

    const allCookieDataJson = JSON.stringify(session.data);

    return (allCookieDataJson);
  }); // end allCookieDataJson = createServerData$()

  // return our route data
  return { savedCookieText, allCookieDataJson }

} // end routeData()



export default function Home() {

  // Destructure the values that were returned from routeData() above;
  const { savedCookieText, allCookieDataJson } = useRouteData<typeof routeData>();

  // Set up a server action to create a cookie, set a default secret value, and track page loads.
  // This will be called below inside an onMount() to ensure it runs once the page is loaded.
  const [, setupCookie] = createServerAction$(async (_, { request }) => {

    console.log("Page loaded: Setting secret cookie data")

    // Get our session from the cookie that's passed through request headers 
    const session = await storage.getSession(request.headers.get("Cookie"));

    // Set some secret data
    session.set("secretData", "This is some secret cookie data that was set when you visited the site!");

    // For fun, let's also keep track of page loads.
    // See if there's a cookie value called "pageLoads", and if so increment it by 1, otherwise set it to 1
    const pageLoadsOld = session.get("pageLoads");
    const pageLoadsNew = pageLoadsOld ? pageLoadsOld + 1 : 1;
    session.set("pageLoads", pageLoadsNew);

    // Create a new encrypted cookie string
    const newCookie = await storage.commitSession(session);

    // Set the new cookie string
    return json({ newCookie }, {
      headers: {
        "Set-Cookie": newCookie
      }
    });

  }); // end [, setupCookie] = createServerAction$()

  // Call the server action to create initial cookie data once the page is loaded
  onMount(() => setupCookie());

  // Create a server action to update a cookie value based on user input
  // This will be called below when the user clicks a button.
  // We have to pass the new data in through a handler function that runs on the client,
  // because the server doesn't have direct access to the values entered in the browser.
  const [, updateCookieText] = createServerAction$(async (data: { newText: string }, { request }) => {

    // get our session from the cookie that's passed through request headers 
    const session = await storage.getSession(request.headers.get("Cookie"));

    // get the old text value for the field "savedText"
    const oldText = session.get("savedText");

    // our new text is supplied by the user
    const newText = data.newText;

    // log to console
    console.log("Old text: " + oldText);
    console.log("New text: " + newText);

    // set the updated text value in our session
    session.set("savedText", newText);

    // create a new cookie (encrypted string) encoding the new value
    const newCookie = await storage.commitSession(session);

    // send a response that will update the cookie on the user's browser
    return json({ newCookie }, {
      headers: {
        "Set-Cookie": newCookie
      }
    });

  }); // end [, updateCookieText] = createServerAction$


  // server action to clear all session cookie data
  const [, destroyCookie] = createServerAction$(async (_, { request }) => {

    // get our session from the cookie that's passed through request headers 
    const session = await storage.getSession(request.headers.get("Cookie"));

    // create a new cookie with no secret data in it
    const destroyedCookie = await storage.destroySession(session);

    // update the browser the use the new cookie without any secret data
    return json({ destroyedCookie }, {
      headers: {
        "Set-Cookie": destroyedCookie
      }
    });

  }); // end  const [, destroyCookie] = createServerAction$()


  // Button handler that gets the user-supplied value from the browser, then sends it to the
  // server to run in our server action.
  const handleCookieUpdateButton = () => {
    console.log("Updating cookie value")

    // get the user-entered value
    const newTextEl = document.getElementById("newcookietext") as HTMLInputElement;
    const newText = newTextEl.value;

    console.log("New user text: " + newText);

    // call our server action with the new text. Note that server actions seem to requre all data
    // to be passed as a single object which is called "data" in the server action handler
    updateCookieText({ newText })

  } // end handleCookieUpdateButton()

  // render our beautiful UI
  return (
    <main>
      <h1>Session cookies in Solid Start</h1>
      <br />
      <h3>
        A simple example of setting, getting, and destroying encrypted session cookies using solidjs and solidstart.
      </h3>
      <hr />
      <div>
        <div>Enter some text to save in your session cookie:</div>
        <input type="text" id="newcookietext"></input>
        <button onClick={handleCookieUpdateButton}>save cookie data</button>

        <br />
        Text saved in cookie: {savedCookieText() ? savedCookieText() : "No text saved in cookie!"}
      </div>
      <hr />
      <div>
        <button onClick={() => destroyCookie()}>Destroy Session Cookie</button>
      </div>
      <hr />
      <div>
        <h3>Session cookie data in json format:</h3>
        {allCookieDataJson()}
      </div>
      <hr />
      <div>
        <a href="https://github.com/chris31415926535/solidstart-sessioncookie-min-example" target="_blank">
          View the source code on GitHub here!
        </a>
      </div>

    </main>)

}