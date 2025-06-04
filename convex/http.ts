// import { httpRouter } from "convex/server";
// import { httpAction } from "./_generated/server";
// import { api } from "./_generated/api";
// import { Webhook } from "svix";

// const http = httpRouter();

// http.route({
//       path: "/clerk-webhook",
//       method: "POST",
//       handler: httpAction(async (ctx, request) => {

//             const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

//             if (!webhookSecret) {
//                   throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
//             }

//             //check headers
//             const svix_id = request.headers.get("svix_id");
//             const svix_signature = request.headers.get("svix_signature");
//             const svix_timestamp = request.headers.get("svix_timestamp");

//             if (!svix_id || !svix_signature || !svix_timestamp) {
//                   return new Response("Error occurred --no svix headers", {
//                         status: 400,
//                   });
//             }

//             const payload = await request.json();
//             const body = JSON.stringify(payload);

//             const wh = new Webhook(webhookSecret);
//             let evt: any;

//             //verify webhook
//             try {
//                   evt = wh.verify(body, {
//                         "svix-id": svix_id,
//                         "svix-timestamp": svix_timestamp,
//                         "svix-signature": svix_signature,
//                   }) as any;
//             } catch (err) {
//                   console.error("Error verifying webhook:", err);
//                   return new Response("Error occurred", { status: 400 });
//             }

//             const eventType = evt.type;

//             if (eventType === "user.created") {
//                   const { id, email_addresses, first_name, last_name, image_url } = evt.data;

//                   const email = email_addresses[0].email_address;
//                   const name = `${first_name || ""} ${last_name || ""}`.trim();


//                   try {
//                         await ctx.runMutation(api.users.createUser, {
//                               email,
//                               fullname: name,
//                               image: image_url,
//                               clerkId: id,
//                               username: email.split("@")[0],
//                         })
//                   } catch (error) {
//                         console.log("Error creating user:", error);
//                         return new Response("Error creating user", { status: 500 });
//                   }
//             }

//             return new Response("Webhook processed successfully", { status: 200 });
//       }),
// });

// export default http;



import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    console.log("📩 Incoming webhook request received");

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("❌ Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    console.log("🔍 Raw request body:", rawBody);

    // Read Svix headers (must use dash-case)
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      console.error("❌ Missing required Svix headers");
      return new Response("Missing svix headers", { status: 400 });
    }

    // Verify the webhook
    const wh = new Webhook(webhookSecret);
    let evt: any;
    try {
      evt = wh.verify(rawBody, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (err) {
      console.error("❌ Webhook verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("✅ Webhook verified:", evt.type);

    // Parse the body after verifying
    const payload = JSON.parse(rawBody);

    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } =
        payload.data;

      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.users.createUser, {
          email,
          fullname: name,
          image: image_url,
          clerkId: id,
          username: email.split("@")[0],
        });
        console.log("✅ User created in Convex DB");
      } catch (error) {
        console.error("❌ Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    return new Response("✅ Webhook processed successfully", { status: 200 });
  }),
});

export default http;
