"use client";

import { useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Shared sensor config for every drag-to-reorder list in the admin
// (nav links, post/page blocks, homepage sections). A small activation
// distance stops a plain click on the drag handle from registering as a
// drag; the keyboard sensor makes every one of these lists reorderable
// without a mouse, which native HTML5 drag-and-drop (what this replaces)
// never supported at all.
export function useReorderSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}
