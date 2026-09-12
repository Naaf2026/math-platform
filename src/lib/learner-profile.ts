import { createClient } from "@/lib/supabase/client";

export type LearnerProfile = {
  user_id: string; display_name: string | null; full_name: string | null; grade: string | null; school_name: string | null; class_name: string | null; avatar_url: string | null; avatar_emoji: string | null;
  lifetime_xp: number; current_xp: number; current_level: number; level_title: string; level_icon: string; level_min_xp: number; next_level: number | null; next_level_title: string | null; next_level_min_xp: number | null; xp_into_level: number; xp_needed: number; level_progress_percent: number;
  current_streak: number; best_streak: number; missions_completed: number; best_combo: number; achievement_count: number; mastered_topics: number; total_topics: number; recent_questions: number; recent_accuracy: number;
};
export type ProfileActivity = { source: string; reason: string; xp: number; created_at: string };

function client() { const supabase = createClient(); if (!supabase) throw new Error("Supabase is not configured."); return supabase; }
export async function getMyLearnerProfile() { const s=client(); const {data:auth}=await s.auth.getUser(); if(!auth.user) throw new Error("Authentication required."); const {data,error}=await s.rpc("get_my_learner_profile"); if(error) throw error; return (data?.[0]||null) as LearnerProfile|null; }
export async function getMyProfileActivity(limit=8) { const s=client(); const {data:auth}=await s.auth.getUser(); if(!auth.user) throw new Error("Authentication required."); const {data,error}=await s.rpc("get_my_profile_activity",{p_limit:limit}); if(error) throw error; return (data||[]) as ProfileActivity[]; }
export async function checkLearningLevelUp() { const s=client(); const {data:auth}=await s.auth.getUser(); if(!auth.user) throw new Error("Authentication required."); const {data,error}=await s.rpc("check_learning_level_up"); if(error) throw error; return data||[]; }
