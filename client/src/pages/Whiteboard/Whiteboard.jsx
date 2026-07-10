/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
   HiOutlinePresentationChartBar,
   HiPencil,
   HiX,
   HiSave,
   HiZoomIn,
   HiZoomOut,
   HiRefresh,
   HiPlus,
} from "react-icons/hi";
import { createBoard, getBoards, updateBoard } from "../../services/whiteboardService";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/common/PageShell";

const COLORS = ["#f8b500", "#38bdf8", "#22c55e", "#f43f5e", "#ffffff", "#0f172a"];

export default function Whiteboard() {
   const { workspace, user } = useAuth();
   const [boards, setBoards] = useState([]);
   const [activeBoard, setActiveBoard] = useState(null);
   const [name, setName] = useState("");
   const [boardData, setBoardData] = useState({ strokes: [] });
   const [error, setError] = useState(null);
   const [message, setMessage] = useState(null);
   const [remoteMessage, setRemoteMessage] = useState(null);
   const [remoteCursors, setRemoteCursors] = useState([]);
   const [tool, setTool] = useState("pen");
   const [color, setColor] = useState(COLORS[0]);
   const [size, setSize] = useState(4);
   const [zoom, setZoom] = useState(1);
   const [activeStroke, setActiveStroke] = useState(null);
   const [activeShape, setActiveShape] = useState(null);
   const svgRef = useRef(null);
   const socketRef = useRef(null);
   const activeBoardRef = useRef(null);
   const userRef = useRef(user);

   const selectBoard = useCallback((board) => {
      setActiveBoard(board);
      setName(board.name || "");
      setBoardData(board.data || { strokes: [] });
      setMessage(null);
      setError(null);
      setRemoteMessage(null);
      setRemoteCursors([]);
      if (socketRef.current) {
         socketRef.current.emit("joinBoard", board._id);
      }
   }, []);

   const refreshBoards = useCallback(async () => {
      try {
         const res = await getBoards();
         const fetchedBoards = res.data.whiteboards || [];
         setBoards(fetchedBoards);
         if (!activeBoard && fetchedBoards.length) {
            selectBoard(fetchedBoards[0]);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load boards");
      }
   }, [activeBoard, selectBoard]);

   useEffect(() => {
      void refreshBoards();
   }, [refreshBoards]);

   useEffect(() => {
      activeBoardRef.current = activeBoard;
   }, [activeBoard]);

   useEffect(() => {
      userRef.current = user;
   }, [user]);

   const socket = useMemo(() => {
      if (!workspace) return null;
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const socketBase = apiBase.replace(/\/api\/?$/, "");
      return io(socketBase, {
         auth: {
            token: localStorage.getItem("token"),
         },
      });
   }, [workspace]);

   useEffect(() => {
      if (!socket) return;
      socketRef.current = socket;
      socket.on("connect_error", (err) => setError(err.message || "Socket connection failed"));

      socket.on("boardUpdate", ({ board, user: sender }) => {
         const currentBoard = activeBoardRef.current;
         if (!currentBoard || board._id !== currentBoard._id) return;
         setActiveBoard(board);
         setBoardData(board.data || { strokes: [] });
         setRemoteMessage(`${sender.name || "A teammate"} updated the board`);
      });

      socket.on("boardCursor", ({ boardId, cursor, user: sender }) => {
         const currentBoard = activeBoardRef.current;
         const currentUser = userRef.current;
         if (!currentBoard || boardId !== currentBoard._id || sender.id === currentUser?._id) return;
         setRemoteCursors((current) => {
            const next = current.filter((cursorItem) => cursorItem.user.id !== sender.id);
            next.push({ user: sender, cursor });
            return next.slice(-4);
         });
      });

      return () => {
         socket.off("connect_error");
         socket.off("boardUpdate");
         socket.off("boardCursor");
         socket.disconnect();
      };
   }, [socket]);

   const handleCreate = async (e) => {
      e.preventDefault();
      if (!name.trim()) return;
      try {
         const res = await createBoard(name.trim());
         const board = res.data.board;
         setName("");
         setBoards((prev) => [board, ...prev]);
         selectBoard(board);
         setMessage("New board created.");
      } catch (err) {
         setError(err.response?.data?.message || "Could not create board");
      }
   };

   const handleSave = async () => {
      if (!activeBoard) return;
      setError(null);
      setMessage(null);
      try {
         const res = await updateBoard(activeBoard._id, { name, data: boardData });
         setActiveBoard(res.data.board);
         setBoards((prev) => prev.map((board) => (board._id === res.data.board._id ? res.data.board : board)));
         setMessage("Board saved successfully.");
         if (socketRef.current) {
            socketRef.current.emit("boardUpdate", {
               boardId: activeBoard._id,
               data: res.data.board.data,
            });
         }
      } catch (err) {
         setError(err.response?.data?.message || "Unable to save the board right now.");
      }
   };

   const getPoint = (event) => {
      const rect = svgRef.current.getBoundingClientRect();
      return {
         x: ((event.clientX - rect.left) / rect.width) * 1000,
         y: ((event.clientY - rect.top) / rect.height) * 700,
      };
   };

   const handlePointerDown = (event) => {
      if (!activeBoard) return;
      const point = getPoint(event);

      if (tool === "eraser") {
         const index = findNearestStroke(boardData.strokes || [], point);
         if (index >= 0) {
            const nextStrokes = [...(boardData.strokes || [])];
            nextStrokes.splice(index, 1);
            setBoardData({ ...boardData, strokes: nextStrokes });
         }
         return;
      }

      if (tool === "rectangle") {
         const shape = { id: `${Date.now()}`, x: point.x, y: point.y, width: 0, height: 0, color };
         setActiveShape(shape);
         setBoardData((prev) => ({ ...prev, shapes: [...(prev.shapes || []), shape] }));
         return;
      }

      const stroke = {
         id: `${Date.now()}`,
         points: [point],
         color,
         size,
      };
      setActiveStroke(stroke);
      setBoardData((prev) => ({ ...prev, strokes: [...(prev.strokes || []), stroke] }));
   };

   const handlePointerMove = (event) => {
      if (!activeBoard) return;
      const point = getPoint(event);

      if (tool === "rectangle" && activeShape) {
         const nextShape = {
            ...activeShape,
            width: point.x - activeShape.x,
            height: point.y - activeShape.y,
         };
         setActiveShape(nextShape);
         setBoardData((prev) => ({
            ...prev,
            shapes: (prev.shapes || []).map((shape) => (shape.id === activeShape.id ? nextShape : shape)),
         }));
         return;
      }

      if (!activeStroke || tool === "eraser") return;
      const nextStroke = {
         ...activeStroke,
         points: [...activeStroke.points, point],
      };
      setActiveStroke(nextStroke);
      setBoardData((prev) => ({
         ...prev,
         strokes: (prev.strokes || []).map((stroke, index) => (index === (prev.strokes || []).length - 1 ? nextStroke : stroke)),
      }));
   };

   const handlePointerUp = () => {
      setActiveStroke(null);
      setActiveShape(null);
   };

   const strokeSummary = useMemo(() => `${(boardData.strokes || []).length} strokes · ${(boardData.shapes || []).length} shapes`, [boardData.strokes, boardData.shapes]);

   return (
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
         <PageShell title="Canvas sessions" subtitle="Sketch, iterate, and save your board state with the same flow as the Team Weave experience." compact className="p-5 sm:p-6">
            <form onSubmit={handleCreate} className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
               <label className="flex flex-1 items-center gap-2 rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-3 py-2.5 text-sm text-muted-foreground">
                  <HiPlus className="h-4 w-4 text-gold" />
                  <input
                     className="w-full bg-transparent text-sm text-white outline-none"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     placeholder="Board name"
                  />
               </label>
               <button className="rounded-[1.2rem] bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
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
                        className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${activeBoard?._id === board._id ? "border-gold bg-[rgba(248,181,0,0.12)]" : "border-border bg-[rgba(255,255,255,0.03)] hover:border-gold/30 hover:bg-[rgba(255,255,255,0.05)]"}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className="grid h-12 w-12 place-items-center rounded-[1.1rem] bg-[rgba(248,181,0,0.14)] text-gold">
                              <HiOutlinePresentationChartBar className="h-6 w-6" />
                           </div>
                           <div>
                              <div className="font-semibold text-white">{board.name}</div>
                              <div className="text-xs text-muted-foreground">Updated {new Date(board.updatedAt || board.createdAt).toLocaleDateString()}</div>
                           </div>
                        </div>
                     </button>
                  ))
               ) : (
                  <div className="rounded-[1.2rem] border border-dashed border-border/60 bg-[rgba(255,255,255,0.03)] p-8 text-center text-sm text-muted-foreground">
                     No whiteboards yet. Create a board to start capturing your team’s ideas.
                  </div>
               )}
            </div>
         </PageShell>

         <PageShell title={activeBoard?.name || "Select a board"} subtitle="Sketch with a pen, erase lines, and save to the workspace instantly." actions={<button onClick={handleSave} disabled={!activeBoard} className="rounded-[1.2rem] bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"><span className="flex items-center gap-2"><HiSave className="h-4 w-4" />Save board</span></button>} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-border bg-[rgba(255,255,255,0.04)] p-4">
               <button onClick={() => setTool("pen")} className={`rounded-2xl px-3 py-2 text-sm ${tool === "pen" ? "bg-gold text-[var(--noir-900)]" : "bg-transparent text-muted-foreground"}`}>
                  <span className="flex items-center gap-2"><HiPencil className="h-4 w-4" /> Pen</span>
               </button>
               <button onClick={() => setTool("eraser")} className={`rounded-2xl px-3 py-2 text-sm ${tool === "eraser" ? "bg-gold text-[var(--noir-900)]" : "bg-transparent text-muted-foreground"}`}>
                  <span className="flex items-center gap-2"><HiX className="h-4 w-4" /> Eraser</span>
               </button>
               <button onClick={() => setTool("rectangle")} className={`rounded-2xl px-3 py-2 text-sm ${tool === "rectangle" ? "bg-gold text-[var(--noir-900)]" : "bg-transparent text-muted-foreground"}`}>
                  <span className="flex items-center gap-2"><HiOutlinePresentationChartBar className="h-4 w-4" /> Box</span>
               </button>
               <div className="mx-1 h-6 w-px bg-border" />
               <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Size</span>
                  <input type="range" min="1" max="12" value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-gold" />
               </label>
               <div className="flex items-center gap-2">
                  {COLORS.map((swatch) => (
                     <button key={swatch} onClick={() => setColor(swatch)} className={`h-6 w-6 rounded-full border-2 ${color === swatch ? "border-white" : "border-transparent"}`} style={{ backgroundColor: swatch }} />
                  ))}
               </div>
               <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))} className="rounded-2xl border border-border p-2 text-muted-foreground hover:text-white"><HiZoomOut className="h-4 w-4" /></button>
                  <span className="min-w-12 text-center text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
                  <button onClick={() => setZoom((value) => Math.min(2, value + 0.1))} className="rounded-2xl border border-border p-2 text-muted-foreground hover:text-white"><HiZoomIn className="h-4 w-4" /></button>
                  <button onClick={() => { setZoom(1); }} className="rounded-2xl border border-border p-2 text-muted-foreground hover:text-white"><HiRefresh className="h-4 w-4" /></button>
               </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.7rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(248,181,0.08),transparent_18%),#020617] p-3">
               {remoteMessage ? (
                  <div className="mb-3 rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0.08)] p-3 text-sm text-gold">
                     {remoteMessage}
                  </div>
               ) : null}
               <svg
                  ref={svgRef}
                  viewBox="0 0 1000 700"
                  className="h-[560px] w-full cursor-crosshair rounded-[1.3rem] border border-border/70 bg-[rgba(255,255,255,0.03)]"
                  onPointerDown={handlePointerDown}
                  onPointerMove={(event) => {
                     handlePointerMove(event);
                     if (socketRef.current && activeBoard) {
                        const rect = svgRef.current.getBoundingClientRect();
                        const point = {
                           x: ((event.clientX - rect.left) / rect.width) * 1000,
                           y: ((event.clientY - rect.top) / rect.height) * 700,
                        };
                        socketRef.current.emit("boardCursor", {
                           boardId: activeBoard._id,
                           cursor: point,
                        });
                     }
                  }}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
               >
                  <rect x="0" y="0" width="1000" height="700" fill="transparent" />
                  <g transform={`scale(${zoom})`}>
                     {(boardData.strokes || []).map((stroke) => (
                        <path
                           key={stroke.id}
                           d={stroke.points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")}
                           fill="none"
                           stroke={stroke.color}
                           strokeWidth={stroke.size}
                           strokeLinecap="round"
                           strokeLinejoin="round"
                        />
                     ))}
                     {(boardData.shapes || []).map((shape) => (
                        <rect
                           key={shape.id}
                           x={Math.min(shape.x, shape.x + shape.width)}
                           y={Math.min(shape.y, shape.y + shape.height)}
                           width={Math.abs(shape.width)}
                           height={Math.abs(shape.height)}
                           rx="12"
                           fill="none"
                           stroke={shape.color}
                           strokeWidth="2"
                        />
                     ))}
                     {remoteCursors.map((cursorItem) => (
                        <g key={cursorItem.user.id}>
                           <circle cx={cursorItem.cursor.x} cy={cursorItem.cursor.y} r="12" fill="rgba(248,181,0,0.7)" />
                           <text x={cursorItem.cursor.x + 16} y={cursorItem.cursor.y + 4} fill="#ffffff" fontSize="18" fontWeight="600">
                              {cursorItem.user.name?.split(" ")[0] || "Teammate"}
                           </text>
                        </g>
                     ))}
                  </g>
               </svg>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
               <div>{strokeSummary}</div>
               <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border px-3 py-1">{activeBoard ? "Autosync ready" : "Create a board to begin"}</span>
                  <button onClick={() => setBoardData({ strokes: [] })} className="rounded-full border border-border px-3 py-1 text-white transition hover:border-gold/40">Clear canvas</button>
               </div>
            </div>

            {message ? <div className="mt-4 rounded-[1.2rem] border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">{message}</div> : null}
            {error ? <div className="mt-4 rounded-[1.2rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
         </PageShell>
      </div>
   );
}

function findNearestStroke(strokes, point) {
   let bestIndex = -1;
   let bestDistance = Number.POSITIVE_INFINITY;

   strokes.forEach((stroke, index) => {
      stroke.points.forEach((segment) => {
         const distance = Math.hypot(segment.x - point.x, segment.y - point.y);
         if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = index;
         }
      });
   });

   return bestDistance < 30 ? bestIndex : -1;
}
