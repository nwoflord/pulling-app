import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    const { class_id } = await request.json();
    if (!class_id) return NextResponse.json({ error: "Class ID required" }, { status: 400 });

    // --- 1. CLEANUP (Reset everything first) ---
    // Delete all existing hooks (matches) for this class
    await db.query('DELETE FROM hooks WHERE class_id = $1', [class_id]);

    // Reset entry statuses to 'active' and remove finish positions
    await db.query("UPDATE entries SET status = 'active', finish_position = NULL WHERE class_id = $1", [class_id]);

    // --- 2. GENERATE NEW BRACKET ---
    // Fetch all entries for this class
    const res = await db.query('SELECT entry_id FROM entries WHERE class_id = $1', [class_id]);
    let entries = res.rows;

    if (entries.length < 2) {
        return NextResponse.json({ error: "Need at least 2 trucks to generate a bracket." }, { status: 400 });
    }

    // Shuffle entries (Randomize the bracket)
    entries = entries.sort(() => Math.random() - 0.5);

    // Calculate Power of 2 Bracket Size
    let p = 2;
    while (p < entries.length) p *= 2;
    
    const numByes = p - entries.length;
    const totalMatchesR1 = p / 2;
    const totalRounds = Math.log2(p);

    // Distribute BYEs evenly across the first round
    const isByeMatch = new Array(totalMatchesR1).fill(false);
    if (numByes > 0) {
        const step = totalMatchesR1 / numByes;
        for (let i = 0; i < numByes; i++) {
            isByeMatch[Math.floor(i * step)] = true;
        }
    }

    let entryIndex = 0;
    
    // We will build the bracket tree from Finals down to Round 1 
    // to easily assign `next_hook_id` to the earlier rounds.
    // Store hooks by round: hooksByRound[roundNum] = array of hook objects
    const hooksByRound: Record<number, any[]> = {};

    for (let r = totalRounds; r >= 1; r--) {
        hooksByRound[r] = [];
        const matchesInRound = Math.pow(2, totalRounds - r);
        const startingMatchOrder = p - (p / Math.pow(2, r - 1)) + 1;

        for (let m = 0; m < matchesInRound; m++) {
            
            // If we are not the final round, we have a "next" hook (our parent in the tree)
            // The parent match index in the previous array is Math.floor(m / 2)
            let nextHookId = null;
            let bracketObjPos = null;
            
            if (r < totalRounds) {
                 const parentMatch = hooksByRound[r + 1][Math.floor(m / 2)];
                 nextHookId = parentMatch.hook_id;
                 bracketObjPos = m % 2 === 0 ? 'top' : 'bottom';
            }

            // Create the record in DB
            // Assign exactly unique match sequences (1 to P-1) to avoid db UNIQUE constraints
            const actualOrder = startingMatchOrder + m;
            const res = await db.query(
                `INSERT INTO hooks (class_id, round, next_hook_id, bracket_position, match_order) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING hook_id`,
                [class_id, r, nextHookId, bracketObjPos, actualOrder]
            );

            hooksByRound[r].push({
                hook_id: res.rows[0].hook_id,
                match_index: m
            });
        }
    }

    // Now that the empty tree exists, let's slot the trucks into Round 1
    // and naturally cascade BYEs forward.
    const round1Hooks = hooksByRound[1];

    for (let i = 0; i < totalMatchesR1; i++) {
        const hook = round1Hooks[i];
        
        if (isByeMatch[i]) {
            // BYE match
            const entryA = entries[entryIndex];
            entryIndex++; 
            
            // Set truck in Round 1 and instantly declare it the winner
            await db.query(
                `UPDATE hooks 
                 SET entry1_id = $1, winner_entry_id = $1 
                 WHERE hook_id = $2`,
                [entryA?.entry_id || null, hook.hook_id]
            );

            // Cascade this BYE winner to Round 2 immediately
            if (hook.next_hook_id && entryA) {
                const posField = i % 2 === 0 ? 'entry1_id' : 'entry2_id';
                await db.query(
                    `UPDATE hooks SET ${posField} = $1 WHERE hook_id = $2`,
                    [entryA.entry_id, hook.next_hook_id]
                );
            }
            
        } else {
            // Regular match
            const entryA = entries[entryIndex];
            const entryB = entries[entryIndex + 1];
            entryIndex += 2; 
            
            await db.query(
                `UPDATE hooks 
                 SET entry1_id = $1, entry2_id = $2 
                 WHERE hook_id = $3`,
                [entryA?.entry_id || null, entryB?.entry_id || null, hook.hook_id]
            );
        }
    }

    // --- 3. LOCK THE CLASS ---
    // This prevents new registrations while the bracket is active
    await db.query('UPDATE classes SET is_locked = TRUE WHERE class_id = $1', [class_id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("GENERATION ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
