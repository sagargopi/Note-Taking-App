"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import * as Dialog from "@radix-ui/react-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Trash2, Plus, LogOut, Edit } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Note {
  _id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  authProvider: "email" | "google"
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNote, setNewNote] = useState({ title: "", content: "" })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const initializeDashboard = async () => {
      // Handle Google OAuth redirect with token
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      const userParam = urlParams.get('user')
      const message = urlParams.get('message')
      
      if (token && userParam) {
        try {
          const userData = JSON.parse(userParam)
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(userData))
          setUser(userData)
          
          // Clean up URL
          window.history.replaceState({}, document.title, "/dashboard")
          
          // Show welcome message
          if (message) {
            toast({
              title: "Success!",
              description: message,
            })
          } else {
            toast({
              title: "Welcome!",
              description: "Successfully signed in with Google",
            })
          }
          
          // Fetch notes after setting user
          await fetchNotes()
          setLoading(false)
        } catch (error) {
          console.error("Error parsing Google OAuth data:", error)
          setLoading(false)
        }
      } else {
        // Check authentication first, then fetch notes
        await checkAuth()
        await fetchNotes()
      }
    }

    initializeDashboard()
  }, [toast])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error('No token found')
      }

      const userResponse = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!userResponse.ok) {
        throw new Error('Not authenticated')
      }
      const userData = await userResponse.json()
      setUser(userData)
      
      // Store user in localStorage as fallback
      localStorage.setItem("user", JSON.stringify(userData))
      setLoading(false)
    } catch (error) {
      console.error("Auth check error:", error)
      // If API fails, check localStorage
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        } else {
          router.push("/")
        }
      } catch (storageError) {
        console.error("Error accessing localStorage:", storageError)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }
  }

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found for fetching notes")
        setNotes([])
        return
      }

      const notesResponse = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!notesResponse.ok) {
        throw new Error('Failed to fetch notes')
      }
      const notesData = await notesResponse.json()
      setNotes(Array.isArray(notesData) ? notesData : [])
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast({
        title: "Error",
        description: "Failed to load notes. Please try again.",
        variant: "destructive",
      })
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Still redirect even if API call fails
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      router.push("/")
    }
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      })

      if (response.ok) {
        const data = await response.json()
        setNotes([data.note, ...notes])
        setNewNote({ title: "", content: "" })
        setIsCreateDialogOpen(false)
        toast({
          title: "Success",
          description: "Note created successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to create note",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating note:", error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditNote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingNote || !editingNote.title.trim() || !editingNote.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/notes/${editingNote._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingNote.title,
          content: editingNote.content,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNotes(notes.map((note) => (note._id === editingNote._id ? data.note : note)))
        setEditingNote(null)
        setIsEditDialogOpen(false)
        toast({
          title: "Success",
          description: "Note updated successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update note",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating note:", error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setNotes(notes.filter((note) => note._id !== noteId))
        toast({
          title: "Success",
          description: "Note deleted successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete note",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (note: Note) => {
    setEditingNote({ ...note })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">HD Notes</h1>
                  <p className="text-sm text-gray-500">Dashboard</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4">
              {user.avatar ? (
                <img src={user.avatar || "/placeholder.svg"} alt="Profile" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Welcome, {user?.name || 'User'}!
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Signed in via {user.authProvider === "google" ? "Google" : "Email"}
                </p>
              </div>
            </div>
          </div>

          {/* Create Note Button */}
          <div className="mb-6">
            <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <Dialog.Trigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white p-6 shadow-lg focus:outline-none">
                  <Dialog.Title className="text-lg font-semibold mb-4">Create New Note</Dialog.Title>
                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      placeholder="Enter note title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      placeholder="Write your note here..."
                      rows={6}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false)
                        setNewNote({ title: "", content: "" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Note</Button>
                  </div>
                </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          {/* Notes Grid */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Notes ({notes.length})</h3>

            {notes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h4>
                <p className="text-gray-500 mb-4">Create your first note to get started!</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Note
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <Card key={note._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 line-clamp-2 flex-1">{note.title}</h4>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => openEditDialog(note)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note._id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-3">{note.content}</p>
                      <p className="text-xs text-gray-400">
                        {note.updatedAt !== note.createdAt ? "Updated" : "Created"} {formatDate(note.updatedAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Note Dialog */}
        <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white p-6 shadow-lg focus:outline-none">
              <Dialog.Title className="text-lg font-semibold mb-4">Edit Note</Dialog.Title>
              {editingNote && (
              <form onSubmit={handleEditNote} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    placeholder="Enter note title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    placeholder="Write your note here..."
                    rows={6}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false)
                      setEditingNote(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Note</Button>
                </div>
              </form>
            )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  )
}
