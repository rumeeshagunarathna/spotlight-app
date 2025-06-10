import { mutation} from "./_generated/server";
import { ConvexError,v } from "convex/values";
import { getAuthenticatedUser } from "./users";

export const addComment = mutation({
      args: {
            content: v.string(),
            postId: v.id("posts")
      },

      handler: async (ctx, args) => {
            const currentUser = await getAuthenticatedUser(ctx);

            const post = await ctx.db.get(args.postId);
            if (!post) throw new ConvexError("Post not found");

            const commentId = await ctx.db.insert("comments", {
                  userId: currentUser?._id,
                  postId: args.postId,
                  content: args.content,
            });

            //increment comment count by 1
            await ctx.db.patch(args.postId, { comments: post.comments + 1 });

            //create a notification if it's not my own post
            if (post.userId !== currentUser._id) {
                  await ctx.db.insert("notifications", {
                        receiverId: post.userId,
                        senderId: currentUser._id,
                        type: "comment",
                        postId: args.postId,
                        commentId,
                  })
            }
      },

});

