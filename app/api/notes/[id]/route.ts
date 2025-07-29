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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 })
    }

    await connectDB()

    const note = await Note.findOneAndDelete({ _id: id, userId })

    if (!note) {
      return NextResponse.json({ error: "Note not found or you don't have permission to delete it" }, { status: 404 })
    }

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("❌ Delete note error:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    }

    const { id } = params
    const { title, content } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 })
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      return NextResponse.json({ error: "Title and content cannot be empty" }, { status: 400 })
    }

    await connectDB()

    const note = await Note.findOneAndUpdate(
      { _id: id, userId },
      { title: title.trim(), content: content.trim() },
      { new: true },
    )

    if (!note) {
      return NextResponse.json({ error: "Note not found or you don't have permission to edit it" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Note updated successfully",
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    })
  } catch (error) {
    console.error("❌ Update note error:", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}
