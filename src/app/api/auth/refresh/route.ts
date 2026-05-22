import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth";
import { refreshSchema } from "@/lib/validators";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookieToken = req.cookies.get("refreshToken")?.value;
    const parsed = refreshSchema.safeParse({
      refreshToken: body.refreshToken || cookieToken,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Refresh token required" }, { status: 400 });
    }

    const payload = verifyRefreshToken(parsed.data.refreshToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== parsed.data.refreshToken) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const newPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);
    user.refreshToken = refreshToken;
    await user.save();

    const res = NextResponse.json({ accessToken, refreshToken });
    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });
    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
