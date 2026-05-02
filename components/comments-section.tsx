'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Comment {
  id: string
  aid_id: string
  user_id: string
  body: string
  created_at: string
  user: {
    id: string
    display_name: string
    hospital?: string
    role: string
  }
}

interface CommentsSectionProps {
  aidId: string
}

export function CommentsSection({ aidId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
    getCurrentUser()
  }, [aidId])

  async function getCurrentUser() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  async function fetchComments() {
    try {
      const response = await fetch(`/api/aids/${aidId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/aids/${aidId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: newComment })
      })

      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeleteClick(commentId: string) {
    setCommentToDelete(commentId)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!commentToDelete) return

    setDeletingId(commentToDelete)
    try {
      const response = await fetch(`/api/aids/${aidId}/comments/${commentToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentToDelete))
      } else if (response.status === 401) {
        alert('יש להתחבר כדי למחוק תגובות')
      } else if (response.status === 403) {
        alert('אין לך הרשאה למחוק תגובה זו')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('שגיאה במחיקת התגובה')
    } finally {
      setDeletingId(null)
      setDeleteDialogOpen(false)
      setCommentToDelete(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="כתוב תגובה..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? 'שולח...' : 'פרסם תגובה'}
              <Send className="h-4 w-4 me-2" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-6 bg-muted/30 rounded-lg text-center">
          <p className="text-muted-foreground mb-3">יש להתחבר כדי להגיב</p>
          <Link href="/auth/login">
            <Button>התחבר</Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold">
            תגובות ({comments.length})
          </h3>
        </div>

        {comments.length === 0 && currentUserId ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>אין תגובות עדיין</p>
            <p className="text-sm">היה הראשון להגיב!</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => {
              const canDelete = currentUserId === comment.user_id
              return (
              <div key={comment.id} className="flex gap-3 p-4 bg-muted/30 rounded-lg group">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback>
                    {getInitials(comment.user.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">
                      {comment.user.display_name}
                    </p>
                    {comment.user.hospital && (
                      <p className="text-xs text-muted-foreground">
                        {comment.user.hospital}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('he-IL', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {comment.body}
                  </p>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteClick(comment.id)}
                    disabled={deletingId === comment.id}
                    aria-label="מחק תגובה"
                  >
                    {deletingId === comment.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                )}
              </div>
            )})}
          </div>
        ) : null}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת תגובה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק תגובה זו? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
