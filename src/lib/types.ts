export type MediaType = "movie" | "tv";

export interface Title {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: number | null;
  genres: string[] | null;
  subgenres?: string[] | null;
  rating_avg: number;
  rating_count: number;
  critic_score: number;
  tmdb_popularity: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  avatar_emoji: string;
  avatar_bg: string;
  created_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  title_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  title_id: string;
  parent_id: string | null;
  content: string;
  upvote_count: number;
  downvote_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "username" | "avatar_emoji" | "avatar_bg">;
  replies?: Comment[];
  user_has_voted?: boolean;
  user_has_downvoted?: boolean;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  popularity: number;
  vote_average?: number;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  popularity: number;
  vote_average?: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  title_id: string;
  created_at: string;
}

export interface DebateThread {
  id: string;
  title_id: string;
  prompt: string;
  created_at: string;
}

export interface DebateReply {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  upvote_count: number;
  created_at: string;
  profiles?: Pick<Profile, "username" | "avatar_emoji" | "avatar_bg">;
}

export interface WatchlistEntry {
  id: string;
  user_id: string;
  title_id: string;
  watched: boolean;
  watched_at: string | null;
  created_at: string;
  title?: Title;
}

export type NotificationType = "comment_upvote" | "comment_reply" | "debate_reply" | "debate_follow_reply";

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  title_id: string | null;
  comment_id: string | null;
  debate_thread_id: string | null;
  read: boolean;
  created_at: string;
  actor_profile?: { username: string; avatar_emoji: string };
  title?: { id: string; title: string; media_type: string };
}

export interface ActivityItem {
  id: string;
  user_id: string;
  type: "rating" | "comment" | "debate_reply" | "joined";
  title_id: string | null;
  reference_id: string | null;
  metadata: { score?: number; content?: string; username?: string; thread_id?: string };
  created_at: string;
  profile?: { username: string; avatar_emoji: string };
  title?: { id: string; title: string; poster_path: string | null; media_type: string };
}
