import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
import type { CastWithInteractions } from "@neynar/nodejs-sdk/build/api";
import { NextResponse } from "next/server";

const castToPost = (cast: CastWithInteractions) => {
  return {
    id: cast.hash,
    text: cast.text,
    embeds: cast.embeds,
    timestamp: cast.timestamp,
    author: cast.author,
    reactions: cast.reactions,
    replies: cast.replies,
  };
};

export async function GET(request: Request) {
  const neynarApiKey = process.env.NEXT_NEYNAR_API_KEY;

  if (!neynarApiKey) {
    console.warn("No Neynar API key found");
    return NextResponse.json(
      { error: "No Neynar API key found" },
      { status: 500 }
    );
  }

  try {
    // Get cursor from query params for pagination
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    const neynarClient = new NeynarAPIClient(
      new Configuration({
        apiKey: neynarApiKey,
      })
    );

    const response = await neynarClient.fetchFeed({
      feedType: "filter",
      filterType: "global_trending",
      limit: 15,
      ...(cursor && { cursor }),
    });

    return NextResponse.json({
      posts: response.casts.map(castToPost),
      nextCursor: response.next?.cursor || null,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
