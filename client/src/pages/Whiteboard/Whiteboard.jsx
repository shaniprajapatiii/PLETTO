/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
   HiTrash,
   HiSearch,
   HiArrowsExpand,
} from "react-icons/hi";
import { createBoard, getBoards, updateBoard, deleteBoard } from "../../services/whiteboardService";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/common/PageShell";

const COLORS = ["#f8b500", "#38bdf8", "#22c55e", "#f43f5e", "#ffffff", "#0f172a"];

export default function Whiteboard() {
   const { workspace, user } = useAuth();
   const [searchParams, setSearchParams] = useSearchParams();

   const [boards, setBoards] = useState([]);
   const [activeBoard, setActiveBoard] = useState(null);
   const [name, setName] = useState("");
   const [boardData, setBoardData] = useState({ strokes: [] });
   const [searchQuery, setSearchQuery] = useState("");
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
   const [isFullScreen, setIsFullScreen] = useState(false);

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
      setSearchParams({ board: board._id });
   }, [setSearchParams]);

   const refreshBoards = useCallback(async () => {
      try {
         const res = await getBoards();
         const fetchedBoards = res.data.whiteboards || [];
         setBoards(fetchedBoards);

         const boardIdParam = searchParams.get("board");
         const fullScreenParam = searchParams.get("fullscreen");

         if (fullScreenParam === "true") {
            setIsFullScreen(true);
         }

         if (boardIdParam) {
            const matched = fetchedBoards.find((b) => b._id === boardIdParam);
            if (matched) {
               selectBoard(matched);
               return;
            }
         }

         if (!activeBoard && fetchedBoards.length) {
            selectBoard(fetchedBoards[0]);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load boards");
      }
   }, [activeBoard, selectBoard, searchParams]);

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
      if (e) e.preventDefault();
      const boardName = prompt("Enter new whiteboard name:", "Untitled board");
      if (!boardName || !boardName.trim()) return;

      try {
         const res = await createBoard(boardName.trim());
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

   const handleDeleteBoard = async (boardId) => {
      if (!window.confirm("Are you sure you want to delete this whiteboard?")) return;

      try {
         await deleteBoard(boardId);
         const nextBoards = boards.filter((b) => b._id !== boardId);
         setBoards(nextBoards);
         if (activeBoard?._id === boardId) {
            if (nextBoards.length > 0) {
               selectBoard(nextBoards[0]);
            } else {
               setActiveBoard(null);
               setBoardData({ strokes: [] });
            }
         }
      } catch (err) {
         setError(err.response?.data?.message || "Could not delete whiteboard");
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

   const filteredBoards = useMemo(() => {
      if (!searchQuery.trim()) return boards;
      const q = searchQuery.toLowerCase();
      return boards.filter((b) => b.name?.toLowerCase().includes(q));
   }, [boards, searchQuery]);

   // Main Whiteboard Editor Container
   const renderWhiteboardEditor = () => (
      <div className={`space-y-3 ${isFullScreen ? "fixed inset-0 z-50 bg-zinc-950 p-6 overflow-y-auto" : ""}`}>
         {/* Toolbar Header */}
         <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center gap-1.5">
               <button
                  onClick={() => setTool("pen")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tool === "pen" ? "bg-[#f9ebae] text-zinc-950 font-bold shadow" : "text-zinc-400 hover:text-white"}`}
               >
                  <HiPencil size={14} />
                  <span>Pen</span>
               </button>
               <button
                  onClick={() => setTool("eraser")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tool === "eraser" ? "bg-[#f9ebae] text-zinc-950 font-bold shadow" : "text-zinc-400 hover:text-white"}`}
               >
                  <HiX size={14} />
                  <span>Eraser</span>
               </button>
               <button
                  onClick={() => setTool("rectangle")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tool === "rectangle" ? "bg-[#f9ebae] text-zinc-950 font-bold shadow" : "text-zinc-400 hover:text-white"}`}
               >
                  <HiOutlinePresentationChartBar size={14} />
                  <span>Box</span>
               </button>
            </div>

            {/* Swatches & Zoom */}
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5">
                  {COLORS.map((swatch) => (
                     <button
                        key={swatch}
                        onClick={() => setColor(swatch)}
                        className={`h-5 w-5 rounded-full border-2 transition ${color === swatch ? "border-[#f9ebae] scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: swatch }}
                     />
                  ))}
               </div>
               <div className="h-4 w-px bg-zinc-800" />
               <div className="flex items-center gap-1">
                  <button onClick={() => setZoom((v) => Math.max(0.7, v - 0.1))} className="p-1 text-zinc-400 hover:text-white" title="Zoom out"><HiZoomOut size={14} /></button>
                  <span className="text-xs font-mono text-zinc-400 w-8 text-center">{zoom.toFixed(1)}x</span>
                  <button onClick={() => setZoom((v) => Math.min(2, v + 0.1))} className="p-1 text-zinc-400 hover:text-white" title="Zoom in"><HiZoomIn size={14} /></button>
                  <button onClick={() => setZoom(1)} className="p-1 text-zinc-400 hover:text-white" title="Reset Zoom"><HiRefresh size={14} /></button>
               </div>
               <div className="h-4 w-px bg-zinc-800" />

               <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition"
                  title={isFullScreen ? "Exit Fullscreen" : "Expand Full Screen Focus Mode"}
               >
                  {isFullScreen ? <HiArrowsExpand className="rotate-180" size={16} /> : <HiArrowsExpand size={16} />}
               </button>

               {activeBoard && (
                  <button
                     onClick={() => handleDeleteBoard(activeBoard._id)}
                     className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                     title="Delete Board"
                  >
                     <HiTrash size={16} />
                  </button>
               )}
            </div>
         </div>

         {/* SVG Canvas Frame */}
         <div className={`relative rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden ${isFullScreen ? "h-[80vh]" : "h-[540px]"}`}>
            <svg
               ref={svgRef}
               viewBox="0 0 1000 700"
               className="h-full w-full cursor-crosshair"
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
                        d={stroke.points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
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
                        rx="8"
                        fill="none"
                        stroke={shape.color}
                        strokeWidth="2"
                     />
                  ))}
                  {remoteCursors.map((cursorItem) => (
                     <g key={cursorItem.user.id}>
                        <circle cx={cursorItem.cursor.x} cy={cursorItem.cursor.y} r="10" fill="rgba(249,235,174,0.8)" />
                        <text x={cursorItem.cursor.x + 14} y={cursorItem.cursor.y + 4} fill="#ffffff" fontSize="14" fontWeight="600">
                           {cursorItem.user.name?.split(" ")[0] || "Teammate"}
                        </text>
                     </g>
                  ))}
               </g>
            </svg>
         </div>

         {/* Board Footer status */}
         <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>{strokeSummary}</span>
            <button onClick={() => setBoardData({ strokes: [] })} className="text-zinc-400 hover:text-red-400 transition">
               Clear Canvas
            </button>
         </div>

         {message ? <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">{message}</div> : null}
         {error ? <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">{error}</div> : null}
      </div>
   );

   return (
      <PageShell
         title="Interactive Whiteboard"
         subtitle="Collaborative real-time canvas for architecture, brain-storms, and visual planning."
         actions={
            <div className="flex gap-2">
               <button
                  onClick={handleCreate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold rounded-lg shadow-md transition"
               >
                  <HiPlus size={14} />
                  <span>New Board</span>
               </button>
               <button
                  onClick={handleSave}
                  disabled={!activeBoard}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg transition disabled:opacity-50"
               >
                  <HiSave size={14} />
                  <span>Save Board</span>
               </button>
            </div>
         }
      >
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Board List Sidebar */}
            <div className="lg:col-span-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
               <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Whiteboards ({boards.length})</span>
               </div>

               <div className="relative">
                  <HiSearch className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search whiteboards..."
                     className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
                  />
               </div>

               <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
                  {filteredBoards.length > 0 ? (
                     filteredBoards.map((board) => (
                        <div key={board._id} className="group relative">
                           <button
                              type="button"
                              onClick={() => selectBoard(board)}
                              className={`w-full p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                                 activeBoard?._id === board._id
                                    ? "border-[rgba(249,235,174,0.4)] bg-[rgba(249,235,174,0.1)] text-[#f9ebae] font-semibold"
                                    : "border-zinc-800/60 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                              }`}
                           >
                              <HiOutlinePresentationChartBar className={`h-5 w-5 shrink-0 ${activeBoard?._id === board._id ? "text-[#f9ebae]" : "text-zinc-500"}`} />
                              <div className="min-w-0 flex-1 pr-6">
                                 <div className="text-xs font-bold truncate text-zinc-200">{board.name}</div>
                                 <div className="text-[10px] text-zinc-500 truncate mt-0.5">Updated {new Date(board.updatedAt || board.createdAt).toLocaleDateString()}</div>
                              </div>
                           </button>

                           <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteBoard(board._id);
                              }}
                              className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition"
                              title="Delete Board"
                           >
                              <HiTrash size={14} />
                           </button>
                        </div>
                     ))
                  ) : (
                     <div className="py-8 text-center text-xs text-zinc-500">No whiteboards found.</div>
                  )}
               </div>
            </div>

            {/* Right Canvas & Tool Palette */}
            <div className="lg:col-span-8 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
               {renderWhiteboardEditor()}
            </div>
         </div>
      </PageShell>
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
