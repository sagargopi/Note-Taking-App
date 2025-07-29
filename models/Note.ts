import mongoose from "mongoose"

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#ffffff",
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color"],
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes
NoteSchema.index({ userId: 1, createdAt: -1 })
NoteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 })

export default mongoose.models.Note || mongoose.model("Note", NoteSchema)
