export type UserRole = 'curator' | 'verified_contributor' | 'contributor'

export type MediaType = 'illustration' | 'table' | 'summary-table' | 'character' | 'text-only' | 'audio' | 'video' | 'photo'

export type TagCategory = 'diagnosis' | 'sign' | 'pathology' | 'treatment' | 'aid_type' | 'risk_factors'

export type ReactionType = 'heart' | 'brain' | 'lightbulb' | 'laugh'

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  hospital?: string
  bio?: string
  role: UserRole
  invited_by_user_id?: string
  created_at: string
  updated_at: string
}

export interface LearningAid {
  id: string
  uploader_id: string
  title: string
  caption?: string
  body?: string
  explanation?: string
  media_url?: string
  media_type?: MediaType
  source_citation?: string
  chapter?: string  // Bolognia chapter
  verified: boolean
  verified_by_user_id?: string
  verified_at?: string
  pinned: boolean
  featured_until?: string
  created_at: string
  updated_at: string
  uploader?: User
  tags?: Tag[]
  stats?: {
    rating_avg?: number
    rating_count?: number
    reaction_count?: number
    comment_count?: number
    save_count?: number
    uploader_rating?: number  // Rating for the uploader
  }
}

export interface Tag {
  id: string
  category: TagCategory
  value: string
  value_he?: string
  created_at: string
}

export interface Rating {
  id: string
  aid_id: string
  user_id: string
  stars: number
  created_at: string
}

export interface Reaction {
  id: string
  aid_id: string
  user_id: string
  reaction_type: ReactionType
  created_at: string
}

export interface Comment {
  id: string
  aid_id: string
  user_id: string
  body: string
  parent_id?: string
  created_at: string
  updated_at: string
  user?: User
  replies?: Comment[]
}

export interface StudySet {
  id: string
  owner_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface StudySetItem {
  set_id: string
  aid_id: string
  position: number
  last_reviewed_at?: string
  next_review_at?: string
  ease_factor: number
}
