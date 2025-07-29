import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import Note from "@/models/Note"

interface JWTPayload {
  userId: string
  email: string
}

async function getUserFromToken(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    }

    await connectDB()

    const notes = await Note.find({ userId }).sort({ createdAt: -1 }).select("_id title content createdAt updatedAt")

    return NextResponse.json(notes)
  } catch (error) {
    console.error("❌ Get notes error:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    }

    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      return NextResponse.json({ error: "Title and content cannot be empty" }, { status: 400 })
    }

    await connectDB()

    const note = new Note({
      title: title.trim(),
      content: content.trim(),
      userId,
    })

    await note.save()

    return NextResponse.json(
      {
        message: "Note created successfully",
        note: {
          _id: note._id,
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Create note error:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}
