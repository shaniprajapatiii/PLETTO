import { useEffect, useState } from "react";
import { HiOutlinePresentationChartBar } from "react-icons/hi";
import { createBoard, getBoards, updateBoard } from "../../services/whiteboardService";

export default function Whiteboard() {
   const [boards, setBoards] = useState([]);
   const [activeBoard, setActiveBoard] = useState(null);
   const [name, setName] = useState("");
   const [boardData, setBoardData] = useState("{}");
   const [error, setError] = useState(null);
   const [message, setMessage] = useState(null);

   useEffect(() => {
      refreshBoards();
   }, []);

   const refreshBoards = async () => {
      try {
         const res = await getBoards();
         const boards = res.data.whiteboards;
         setBoards(boards);
         if (!activeBoard && boards.length) {
            selectBoard(boards[0]);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load boards");
      }
   };

   const selectBoard = (board) => {
      setActiveBoard(board);
      setBoardData(JSON.stringify(board.data || { nodes: [], notes: [] }, null, 2));
      setMessage(null);
      setError(null);
   };

   const handleCreate = async (e) => {
      e.preventDefault();
      if (!name.trim()) return;
      try {
         const res = await createBoard(name.trim());
         setName("");
         refreshBoards();
         selectBoard(res.data.board);
      } catch (err) {
         setError(err.response?.data?.message || "Could not create board");
      }
   };

   const handleSave = async () => {
      if (!activeBoard) return;
      setError(null);
      setMessage(null);
      try {
         const parsed = JSON.parse(boardData);
         const res = await updateBoard(activeBoard._id, { data: parsed });
         setActiveBoard(res.data.board);
         setMessage("Board saved successfully.");
      } catch (err) {
         setError(err.response?.data?.message || "Unable to save the board. Check your JSON.");
      }
   };

   return (
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
         <section className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-gold">Whiteboards</div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Canvas sessions</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Create a board and keep your ideas organized in one space.</p>
               </div>
            </div>

            <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
               <input
                  className="min-w-[220px] flex-1 rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Board name"
               />
               <button className="rounded-3xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                  Create
               </button>
            </form>

            <div className="mt-6 space-y-3">
               {boards.length > 0 ? (
                  boards.map((board) => (
                     <button
                        key={board._id}
                        type="button"
                        onClick={() => selectBoard(board)}
                        className={`w-full rounded-3xl border px-4 py-4 text-left transition ${activeBoard?._id === board._id ? "border-gold bg-[rgba(248,181,0,0.12)]" : "border-border bg-[rgba(255,255,255,0.03)] hover:border-gold/30 hover:bg-[rgba(255,255,255,0.05)]"}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className="grid h-12 w-12 place-items-center rounded-3xl bg-[rgba(248,181,0,0.14)] text-gold">
                              <HiOutlinePresentationChartBar className="h-6 w-6" />
                           </div>
                           <div>
                              <div className="font-semibold text-white">{board.name}</div>
                              <div className="text-xs text-muted-foreground">Created {new Date(board.createdAt).toLocaleDateString()}</div>
                           </div>
                        </div>
                     </button>
                  ))
               ) : (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-[rgba(255,255,255,0.03)] p-8 text-center text-sm text-muted-foreground">
                     No whiteboards yet. Create a board to start capturing your team’s ideas.
                  </div>
               )}
            </div>
         </section>

         <section className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-gold">Canvas editor</div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">{activeBoard?.name || "Select a board"}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Edit the board payload to keep the session state in sync.</p>
               </div>
               <button
                  onClick={handleSave}
                  disabled={!activeBoard}
                  className="rounded-3xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
               >
                  Save board
               </button>
            </div>

            <textarea
               className="mt-6 min-h-[620px] w-full rounded-[2rem] border border-border bg-[rgba(255,255,255,0.05)] p-5 text-sm text-white outline-none focus:border-gold"
               value={boardData}
               onChange={(e) => setBoardData(e.target.value)}
               placeholder="Enter board JSON payload here"
            />

            {message && <div className="mt-4 rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">{message}</div>}
            {error && <div className="mt-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
         </section>
      </div>
   );
}
