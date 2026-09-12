"use client";

/**
 * The Mission page is the single source of truth for question rendering and
 * progression. This component intentionally renders nothing: a second DOM
 * copy of the question was causing the visible question to become detached
 * from React state and remain on screen after Mission completion.
 */
export default function MissionQuestionPopup() {
  return null;
}
