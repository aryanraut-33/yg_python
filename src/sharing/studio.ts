// API client for the Recipient Studio Page (visitor experience, no auth required).
import { supabase } from '../account/supabase';

export interface StudioProject {
  id: string;
  projectId: string;
  title: string;
  code: string;
  updatedAt: string;
}

export interface StudioReaction {
  projectId: string;
  preset: string;
  count: number;
}

export interface SharedStudioData {
  valid: boolean;
  error?: string;
  childName: string;
  recipientName: string;
  projects: StudioProject[];
  reactions: StudioReaction[];
}

export const PRESET_COMPLIMENTS: { id: string; emoji: string; label: string }[] = [
  { id: 'love', emoji: '❤️', label: 'Loved it!' },
  { id: 'applause', emoji: '👏', label: 'Amazing!' },
  { id: 'rocket', emoji: '🚀', label: 'So cool!' },
  { id: 'laugh', emoji: '😂', label: 'Made me laugh!' },
  { id: 'mindblown', emoji: '🤯', label: 'How did you build this?!' },
  { id: 'make_level_2', emoji: '🎮', label: 'Make a Level 2!' },
  { id: 'proud', emoji: '🏆', label: 'Proud of you!' },
];

export async function fetchSharedStudio(token: string): Promise<SharedStudioData> {
  if (!supabase) {
    // Demo / offline fallback
    return {
      valid: true,
      childName: 'Aarav',
      recipientName: 'Family',
      projects: [
        {
          id: 'demo-1',
          projectId: 'name-light-show',
          title: 'Name Light Show',
          code: 'import stage\n\nstage.background("night")\nstage.circle(320, 200, 60, "butter", glow=True)\nstage.text(320, 200, "AARAV", size=48, color="night")\n',
          updatedAt: new Date().toISOString(),
        },
      ],
      reactions: [
        { projectId: 'demo-1', preset: 'love', count: 1 },
        { projectId: 'demo-1', preset: 'rocket', count: 2 },
      ],
    };
  }

  const { data, error } = await supabase.rpc('get_shared_studio', { invite_token: token });
  if (error || !data) {
    throw new Error(error?.message || 'Could not load studio page');
  }

  return data as SharedStudioData;
}

export async function sendReaction(token: string, projectUuid: string, preset: string): Promise<boolean> {
  if (!supabase) return true;

  const { data, error } = await supabase.rpc('post_reaction', {
    invite_token: token,
    project_uuid: projectUuid,
    reaction: preset,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
