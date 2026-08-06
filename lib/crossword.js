// A crossword's `grid_json` (see supabase/schema.sql) is a plain
// rows x cols letter grid, one string per cell — "#" for a blocked
// (black) square, any single A-Z letter for the solution in a fillable
// one. That's the only thing an admin actually authors; everything
// else a crossword needs (clue numbering, which cells make up "3
// down", how long each answer is) is *derived* from the grid shape by
// computeCrosswordLayout below, the same way a real crossword's
// numbering always follows from its black-square pattern rather than
// being assigned by hand. Both the admin editor (to show live numbers
// while designing the grid) and the public solver (to know what to
// highlight, where Tab/arrow-keys should go, and what each clue's
// answer length is) call this same function, so the two can never
// disagree about what "clue 7" refers to.
//
// { rows, cols, cells } — `cells` is `rows` arrays of `cols`
// single-character strings, "#" or "A"-"Z".
export function computeCrosswordLayout(grid) {
  const { rows, cols, cells } = grid;
  const numbers = Array.from({ length: rows }, () => Array(cols).fill(null));
  const slots = [];
  let counter = 0;

  const blocked = (r, c) => r < 0 || r >= rows || c < 0 || c >= cols || cells[r][c] === "#";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (blocked(r, c)) continue;
      const startsAcross = blocked(r, c - 1) && !blocked(r, c + 1);
      const startsDown = blocked(r - 1, c) && !blocked(r + 1, c);
      if (!startsAcross && !startsDown) continue;

      counter++;
      numbers[r][c] = counter;

      if (startsAcross) {
        const cellCoords = [];
        let cc = c;
        while (!blocked(r, cc)) {
          cellCoords.push([r, cc]);
          cc++;
        }
        slots.push({ number: counter, direction: "across", row: r, col: c, length: cellCoords.length, cellCoords });
      }
      if (startsDown) {
        const cellCoords = [];
        let rr = r;
        while (!blocked(rr, c)) {
          cellCoords.push([rr, c]);
          rr++;
        }
        slots.push({ number: counter, direction: "down", row: r, col: c, length: cellCoords.length, cellCoords });
      }
    }
  }

  return { numbers, slots };
}

// A blank rows x cols grid, every cell fillable — the starting point
// for a new puzzle in the admin editor, which the admin then clicks
// cells on to block out and types letters into.
export function blankGrid(rows, cols) {
  return { rows, cols, cells: Array.from({ length: rows }, () => Array(cols).fill("")) };
}

export async function listCrosswordsForAdmin(supabase) {
  const { data, error } = await supabase
    .from("crosswords")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Same query as listCrosswordsForAdmin — RLS already makes `crosswords`
// public-read (see supabase/schema.sql) — but exposed under its own name
// rather than reused directly, since a public archive page importing
// something literally named "ForAdmin" would read as a permissions bug
// even though it isn't one.
export async function listCrosswordsForArchive(supabase) {
  const { data, error } = await supabase
    .from("crosswords")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCrosswordById(supabase, id) {
  const { data, error } = await supabase.from("crosswords").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// One puzzle at a time, exactly like Guess the Spot's getCurrentRound —
// the most recently created row is "the current puzzle". Publishing a
// new one supersedes the last automatically, no separate "is this the
// current one" flag to manage. (The `issues` table's own `crossword_id`
// column exists for a future "bundle a crossword with a specific
// fortnightly issue's articles" feature — not needed for this, and
// deliberately left alone rather than half-wiring a feature nothing
// else uses yet.)
export async function getCurrentCrossword(supabase) {
  const { data, error } = await supabase
    .from("crosswords")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCrossword(supabase, crossword) {
  const { data, error } = await supabase.from("crosswords").insert(crossword).select().single();
  if (error) throw error;
  return data;
}

export async function updateCrossword(supabase, id, updates) {
  const { data, error } = await supabase
    .from("crosswords")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCrossword(supabase, id) {
  const { error } = await supabase.from("crosswords").delete().eq("id", id);
  if (error) throw error;
}
