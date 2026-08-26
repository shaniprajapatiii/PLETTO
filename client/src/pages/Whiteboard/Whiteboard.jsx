/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
   HiArrowLeft,
   HiSparkles,
   HiClock,
   HiDownload,
   HiAnnotation,
   HiCursorClick,
   HiMinus,
   HiArrowRight,
   HiViewGrid,
   HiReply,
} from "react-icons/hi";
import { createBoard, getBoards, updateBoard, deleteBoard } from "../../services/whiteboardService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { PageShell } from "../../components/common/PageShell";

const COLORS = ["#f8b500", "#38bdf8", "#22c55e", "#f43f5e", "#a855f7", "#ffffff", "#94a3b8", "#1e293b"];
const STICKY_BG_COLORS = ["#fef08a", "#bae6fd", "#bbf7d0", "#fbcfe8", "#e9d5ff"];

export default function Whiteboard() {
   const { user } = useAuth();
   const socket = useSocket();
   const [searchParams, setSearchParams] = useSearchParams();

   const [boards, setBoards] = useState([]);
   const [activeBoard, setActiveBoard] = useState(null);
   const [name, setName] = useState("");
   const [boardData, setBoardData] = useState({ strokes: [], shapes: [], notes: [], texts: [] });
   const [history, setHistory] = useState([]);
   const [redoStack, setRedoStack] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [error, setError] = useState(null);
   const [message, setMessage] = useState(null);
   const [remoteMessage, setRemoteMessage] = useState(null);
   const [remoteCursors, setRemoteCursors] = useState([]);

   // Tooling states
   const [tool, setTool] = useState("pen"); // 'pen', 'highlighter', 'rectangle', 'circle', 'arrow', 'text', 'sticky', 'eraser'
   const [color, setColor] = useState(COLORS[0]);
   const [stickyColor, setStickyColor] = useState(STICKY_BG_COLORS[0]);
   const [size, setSize] = useState(4);
   const [isFilled, setIsFilled] = useState(false);
   const [zoom, setZoom] = useState(1);
   const [showGrid, setShowGrid] = useState(true);

   // Drawing state refs
   const svgRef = useRef(null);
   const socketRef = useRef(null);
   const activeBoardRef = useRef(null);
   const userRef = useRef(user);
   const isDrawingRef = useRef(false);
   const boardDataRef = useRef(boardData);
   const activeStrokeRef = useRef(null);
   const activeShapeRef = useRef(null);
   const [loading, setLoading] = useState(true);

   const selectBoard = useCallback((board) => {
      if (!board) return;

      const boardId = board._id || board.id;
      if (!boardId) return;

      setActiveBoard(board);
      activeBoardRef.current = board;
      setName(board.name || "");
      const initialData = {
         strokes: board.data?.strokes || [],
         shapes: board.data?.shapes || [],
         notes: board.data?.notes || [],
         texts: board.data?.texts || [],
      };
      setBoardData(initialData);
      setHistory([initialData]);
      setRedoStack([]);
      setMessage(null);
      setError(null);
      setRemoteMessage(null);
      setRemoteCursors([]);
      if (socketRef.current) {
         socketRef.current.emit("joinBoard", boardId);
      }

      setSearchParams({ board: boardId });
   }, [setSearchParams]);

   const backToDirectory = () => {
      setActiveBoard(null);
      setName("");
      setBoardData({ strokes: [], shapes: [], notes: [], texts: [] });
      setHistory([]);
      setRedoStack([]);
      setSearchParams({});
   };

   const refreshBoards = useCallback(async () => {
      try {
         setLoading(true);
         const res = await getBoards();
         const fetchedBoards = res.data.whiteboards || [];
         setBoards(fetchedBoards);

         const boardIdParam = searchParams.get("board");
         if (boardIdParam) {
            const matched = fetchedBoards.find((b) => (b._id || b.id)?.toString() === boardIdParam);
            if (matched) {
               selectBoard(matched);
            }
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load whiteboards");
      } finally {
         setLoading(false);
      }
   }, [searchParams, selectBoard]);

   useEffect(() => {
      void refreshBoards();
   }, [refreshBoards]);

   useEffect(() => {
      activeBoardRef.current = activeBoard;
   }, [activeBoard]);

   useEffect(() => {
      userRef.current = user;
   }, [user]);

   useEffect(() => {
      boardDataRef.current = boardData;
   }, [boardData]);

   // Socket Listeners
   useEffect(() => {
      socketRef.current = socket;
      if (!socket) return;

      const handleConnect = () => {
         if (activeBoardRef.current?._id) {
            socket.emit("joinBoard", activeBoardRef.current._id);
         }
      };

      const handleConnectError = (err) => setError(err.message || "Socket connection failed");

      const handleBoardUpdate = ({ board, user: sender }) => {
         const currentBoard = activeBoardRef.current;
         if (!currentBoard || board._id !== currentBoard._id) return;
         setActiveBoard(board);
         const nextData = {
            strokes: board.data?.strokes || [],
            shapes: board.data?.shapes || [],
            notes: board.data?.notes || [],
            texts: board.data?.texts || [],
         };
         setBoardData(nextData);
         setRemoteMessage(`${sender.name || "A teammate"} updated the canvas`);
      };

      const handleBoardCursor = ({ boardId, cursor, user: sender }) => {
         const currentBoard = activeBoardRef.current;
         const currentUser = userRef.current;
         if (!currentBoard || boardId !== currentBoard._id || sender.id === currentUser?._id) return;
         setRemoteCursors((current) => {
            const next = current.filter((cursorItem) => cursorItem.user.id !== sender.id);
            next.push({ user: sender, cursor });
            return next.slice(-4);
         });
      };

      socket.on("connect", handleConnect);
      socket.on("connect_error", handleConnectError);
      socket.on("boardUpdate", handleBoardUpdate);
      socket.on("boardCursor", handleBoardCursor);

      handleConnect();

      return () => {
         socket.off("connect", handleConnect);
         socket.off("connect_error", handleConnectError);
         socket.off("boardUpdate", handleBoardUpdate);
         socket.off("boardCursor", handleBoardCursor);
      };
   }, [socket]);

   // Push state to history stack for Undo/Redo
   const pushHistoryState = (nextData) => {
      setHistory((prev) => [...prev.slice(-20), nextData]);
      setRedoStack([]);
   };

   const handleUndo = () => {
      if (history.length <= 1) return;
      const newHistory = [...history];
      const currentState = newHistory.pop();
      const previousState = newHistory[newHistory.length - 1];
      setRedoStack((prev) => [currentState, ...prev]);
      setHistory(newHistory);
      setBoardData(previousState);
   };

   const handleRedo = () => {
      if (redoStack.length === 0) return;
      const nextState = redoStack[0];
      setRedoStack((prev) => prev.slice(1));
      setHistory((prev) => [...prev, nextState]);
      setBoardData(nextState);
   };

   // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
   useEffect(() => {
      const handleKeyDown = (e) => {
         if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            if (e.shiftKey) {
               handleRedo();
            } else {
               handleUndo();
            }
         } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            handleRedo();
         }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [history, redoStack]);

   const handleCreate = async (e) => {
      if (e) e.preventDefault();
      const boardName = prompt("Enter new whiteboard name:", "Architecture Canvas");
      if (!boardName || !boardName.trim()) return;

      try {
         const res = await createBoard(boardName.trim());
         const board = res.data.board;
         setBoards((prev) => [board, ...prev]);
         selectBoard(board);
         setMessage("New whiteboard created.");
      } catch (err) {
         setError(err.response?.data?.message || "Could not create board");
      }
   };

   const handleSave = async () => {
      if (!activeBoard) return;
      setError(null);
      setMessage(null);
      try {
         const payload = { name, data: boardData };
         const res = await updateBoard(activeBoard._id, payload);
         const savedBoard = res.data.board;
         setActiveBoard(savedBoard);
         setBoards((prev) => prev.map((board) => (board._id === savedBoard._id ? savedBoard : board)));
         setMessage("Board saved successfully.");
         if (socketRef.current?.connected) {
            socketRef.current.emit("boardUpdate", {
               boardId: activeBoard._id,
               data: savedBoard.data,
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
            backToDirectory();
         }
      } catch (err) {
         setError(err.response?.data?.message || "Could not delete whiteboard");
      }
   };

   // Export Canvas as PNG Image
   const handleExportPNG = () => {
      if (!svgRef.current) return;
      const svgElement = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1120;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
         ctx.fillStyle = "#09090b";
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
         URL.revokeObjectURL(url);

         const imgURI = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
         const evt = new MouseEvent("click", {
            view: window,
            bubbles: false,
            cancelable: true,
         });
         const a = document.createElement("a");
         a.setAttribute("download", `${name || "pletto_whiteboard"}.png`);
         a.setAttribute("href", imgURI);
         a.setAttribute("target", "_blank");
         a.dispatchEvent(evt);
      };
      img.src = url;
   };

   const getPointFromClientXY = (clientX, clientY) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) {
         return { x: 500, y: 350 };
      }

      return {
         x: ((clientX - rect.left) / rect.width) * 1000,
         y: ((clientY - rect.top) / rect.height) * 700,
      };
   };

   const getCanvasPoint = (event) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) {
         return { x: 500, y: 350 };
      }

      return {
         x: ((event.clientX - rect.left) / rect.width) * 1000,
         y: ((event.clientY - rect.top) / rect.height) * 700,
      };
   };

   const getPoint = (event) => {
      if (event.touches?.length) {
         const touch = event.touches[0];
         return getPointFromClientXY(touch.clientX, touch.clientY);
      }
      return getPointFromClientXY(event.clientX, event.clientY);
   };

   const handlePointerDown = (event) => {
      if (!activeBoard) return;
      if (event.button !== undefined && event.button !== 0) return;
      const point = getPoint(event);
      isDrawingRef.current = true;
      if (!point || Number.isNaN(point.x) || Number.isNaN(point.y)) return;

      // Sticky Note Placement
      if (tool === "sticky") {
         const text = prompt("Enter Sticky Note Text:", "Agile Note");
         if (text && text.trim()) {
            const note = {
               id: `${Date.now()}`,
               x: point.x - 60,
               y: point.y - 60,
               width: 120,
               height: 120,
               text: text.trim(),
               bgColor: stickyColor,
            };
            const nextData = { ...boardDataRef.current, notes: [...(boardDataRef.current.notes || []), note] };
            setBoardData(nextData);
            pushHistoryState(nextData);
         }
         isDrawingRef.current = false;
         return;
      }

      // Text Label Placement
      if (tool === "text") {
         const text = prompt("Enter Canvas Text Label:", "Process Label");
         if (text && text.trim()) {
            const textItem = {
               id: `${Date.now()}`,
               x: point.x,
               y: point.y,
               text: text.trim(),
               color,
               fontSize: size > 4 ? 24 : 16,
            };
            const nextData = { ...boardDataRef.current, texts: [...(boardDataRef.current.texts || []), textItem] };
            setBoardData(nextData);
            pushHistoryState(nextData);
         }
         isDrawingRef.current = false;
         return;
      }

      // Precision Eraser Tool
      if (tool === "eraser") {
         setBoardData((prev) => {
            const nextStrokes = [...(prev.strokes || [])];
            const index = findNearestStroke(nextStrokes, point);
            if (index >= 0) {
               nextStrokes.splice(index, 1);
            }
            const nextShapes = (prev.shapes || []).filter(
               (s) => Math.hypot(s.x + (s.width || 0) / 2 - point.x, s.y + (s.height || 0) / 2 - point.y) > 40
            );
            const nextNotes = (prev.notes || []).filter(
               (n) => Math.hypot(n.x + (n.width || 120) / 2 - point.x, n.y + (n.height || 120) / 2 - point.y) > 60
            );
            const nextTexts = (prev.texts || []).filter(
               (t) => Math.hypot(t.x - point.x, t.y - point.y) > 30
            );

            const nextBoardData = { ...prev, strokes: nextStrokes, shapes: nextShapes, notes: nextNotes, texts: nextTexts };
            boardDataRef.current = nextBoardData;
            return nextBoardData;
         });
         return;
      }

      // Shapes (Rectangle, Circle, Arrow)
      if (tool === "rectangle" || tool === "circle" || tool === "arrow") {
         const shape = {
            id: `${Date.now()}`,
            type: tool,
            x: point.x,
            y: point.y,
            x2: point.x,
            y2: point.y,
            width: 0,
            height: 0,
            color,
            size,
            isFilled,
         };
         activeShapeRef.current = shape;
         setBoardData((prev) => {
            const nextBoardData = { ...prev, shapes: [...(prev.shapes || []), shape] };
            boardDataRef.current = nextBoardData;
            return nextBoardData;
         });
         return;
      }

      // Pen / Highlighter Drawing
      const stroke = {
         id: `${Date.now()}`,
         type: tool === "highlighter" ? "highlighter" : "pen",
         points: [point],
         color: tool === "highlighter" ? color : color,
         size: tool === "highlighter" ? Math.max(16, size * 3) : size,
         opacity: tool === "highlighter" ? 0.35 : 1,
      };
      activeStrokeRef.current = stroke;
      setBoardData((prev) => {
         const nextBoardData = { ...prev, strokes: [...(prev.strokes || []), stroke] };
         boardDataRef.current = nextBoardData;
         return nextBoardData;
      });
   };

   const handlePointerMove = (event) => {
      if (!activeBoard || !isDrawingRef.current) return;
      const point = getPoint(event);
      if (!point || Number.isNaN(point.x) || Number.isNaN(point.y)) return;

      if ((tool === "rectangle" || tool === "circle" || tool === "arrow") && activeShapeRef.current) {
         const nextShape = {
            ...activeShapeRef.current,
            x2: point.x,
            y2: point.y,
            width: point.x - activeShapeRef.current.x,
            height: point.y - activeShapeRef.current.y,
         };
         activeShapeRef.current = nextShape;
         setBoardData((prev) => {
            const nextBoardData = {
               ...prev,
               shapes: (prev.shapes || []).map((shape) => (shape.id === activeShapeRef.current.id ? nextShape : shape)),
            };
            boardDataRef.current = nextBoardData;
            return nextBoardData;
         });
         return;
      }

      if (!activeStrokeRef.current || tool === "eraser") return;
      const nextStroke = {
         ...activeStrokeRef.current,
         points: [...activeStrokeRef.current.points, point],
      };
      activeStrokeRef.current = nextStroke;
      setBoardData((prev) => {
         const nextBoardData = {
            ...prev,
            strokes: (prev.strokes || []).map((stroke, index) => (index === (prev.strokes || []).length - 1 ? nextStroke : stroke)),
         };
         boardDataRef.current = nextBoardData;
         return nextBoardData;
      });
   };

   const handlePointerUp = () => {
      if (isDrawingRef.current) {
         pushHistoryState(boardDataRef.current);
      }
      isDrawingRef.current = false;
      activeStrokeRef.current = null;
      activeShapeRef.current = null;
   };

   const handleTouchStart = (event) => {
      if (!activeBoard) return;
      event.preventDefault();
      handlePointerDown(event);
   };

   const handleTouchMove = (event) => {
      if (!activeBoard) return;
      event.preventDefault();
      handlePointerMove(event);
   };

   const handleTouchEnd = () => {
      handlePointerUp();
   };

   const strokeSummary = useMemo(
      () =>
         `${(boardData.strokes || []).length} strokes · ${(boardData.shapes || []).length} shapes · ${
            (boardData.notes || []).length
         } sticky notes`,
      [boardData.strokes, boardData.shapes, boardData.notes]
   );

   const filteredBoards = useMemo(() => {
      if (!searchQuery.trim()) return boards;
      const q = searchQuery.toLowerCase();
      return boards.filter((b) => b.name?.toLowerCase().includes(q));
   }, [boards, searchQuery]);

   // Directory Catalog View (Default)
   if (!activeBoard) {
      return (
         <PageShell
            title="Visual Whiteboards"
            subtitle="Collaborative real-time diagramming, sticky notes, and flowcharting. Click any whiteboard to launch full-screen canvas."
            actions={
               <button
                  type="button"
                  onClick={handleCreate}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold shadow-md transition"
               >
                  <HiPlus size={14} />
                  <span>New Whiteboard</span>
               </button>
            }
         >
            {error && (
               <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {error}
               </div>
            )}

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3.5 top-2.5 text-zinc-500" size={14} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search whiteboards by name..."
                     className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
                  />
               </div>
            </div>

            {/* Whiteboard Cards Grid */}
            {loading ? (
               <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f9ebae] border-t-transparent" />
                  <span>Loading whiteboards…</span>
               </div>
            ) : filteredBoards.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBoards.map((board) => {
                     const strokeCount = board.data?.strokes?.length || 0;
                     const shapeCount = board.data?.shapes?.length || 0;
                     const noteCount = board.data?.notes?.length || 0;

                     return (
                        <div
                           key={board._id || board.id}
                           className="group p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-[#f9ebae]/40 hover:bg-zinc-900/60 transition flex flex-col justify-between space-y-4 shadow-xl"
                        >
                           <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                 <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-purple-500/10 text-purple-300 border-purple-500/30">
                                    Visual Canvas
                                 </span>
                                 <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <HiClock size={12} />
                                    {new Date(board.updatedAt || board.createdAt).toLocaleDateString()}
                                 </span>
                              </div>

                              <div className="flex items-center gap-2">
                                 <HiOutlinePresentationChartBar className="text-[#f9ebae] shrink-0" size={20} />
                                 <h3 className="font-bold text-sm text-zinc-100 group-hover:text-[#f9ebae] transition truncate">
                                    {board.name}
                                 </h3>
                              </div>

                              <p className="text-xs text-zinc-400 mt-2">
                                 Interactive canvas with sticky notes, flowcharts, and real-time cursor sync.
                              </p>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                              <span className="text-[11px] font-semibold text-zinc-500">
                                 {strokeCount} strokes · {shapeCount} shapes · {noteCount} notes
                              </span>

                              <div className="flex gap-2">
                                 <button
                                    type="button"
                                    onClick={() => selectBoard(board)}
                                    className="py-1.5 px-3.5 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 rounded-xl transition font-bold text-xs flex items-center gap-1 shadow-md shadow-[#f9ebae]/10"
                                 >
                                    <HiArrowsExpand size={13} />
                                    <span>Open Focus Canvas</span>
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => handleDeleteBoard(board._id)}
                                    className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                                    title="Delete whiteboard"
                                 >
                                    <HiTrash size={14} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="text-center py-20 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-3">
                  <HiOutlinePresentationChartBar className="mx-auto text-zinc-600" size={44} />
                  <h3 className="text-base font-bold text-zinc-200">No whiteboards found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                     Create a visual canvas to start diagramming workflows with your team.
                  </p>
               </div>
            )}
         </PageShell>
      );
   }

   // Full-Screen Dedicated Whiteboard View
   return (
      <div className="fixed inset-0 z-50 bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden">
         {/* Top Header Bar */}
         <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/90 px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
               <button
                  type="button"
                  onClick={backToDirectory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition shrink-0"
               >
                  <HiArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Whiteboards</span>
               </button>

               <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

               <input
                  className="text-sm sm:text-base font-extrabold text-zinc-100 bg-transparent border-b border-transparent focus:border-[#f9ebae] outline-none truncate w-full max-w-md"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Whiteboard name..."
               />
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
               <span className="hidden lg:inline text-[11px] text-zinc-500 font-mono">
                  {strokeSummary}
               </span>

               <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length <= 1}
                  className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition disabled:opacity-40"
                  title="Undo (Ctrl+Z)"
               >
                  <HiReply size={16} />
               </button>

               <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition disabled:opacity-40"
                  title="Redo (Ctrl+Y)"
               >
                  <HiReply className="rotate-180" size={16} />
               </button>

               <button
                  type="button"
                  onClick={handleExportPNG}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white text-xs font-semibold transition"
                  title="Export Canvas to PNG"
               >
                  <HiDownload size={14} />
                  <span className="hidden sm:inline">Export PNG</span>
               </button>

               <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-extrabold shadow-md shadow-[#f9ebae]/20 transition"
               >
                  <HiSave size={16} />
                  <span>Save</span>
               </button>

               <button
                  type="button"
                  onClick={() => handleDeleteBoard(activeBoard._id)}
                  className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                  title="Delete Whiteboard"
               >
                  <HiTrash size={16} />
               </button>
            </div>
         </header>

         {/* Rich Tool Palette & Styling Bar */}
         <div className="bg-zinc-950/90 border-b border-zinc-800/80 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Extended Drawing Tools */}
            <div className="flex flex-wrap items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
               <button
                  type="button"
                  onClick={() => setTool("pen")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                     tool === "pen" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Pen Tool"
               >
                  <HiPencil size={13} />
                  <span>Pen</span>
               </button>

               <button
                  type="button"
                  onClick={() => setTool("highlighter")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                     tool === "highlighter" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Highlighter / Marker"
               >
                  <HiSparkles size={13} />
                  <span>Marker</span>
               </button>

               <button
                  type="button"
                  onClick={() => setTool("rectangle")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                     tool === "rectangle" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Rectangle Box"
               >
                  <HiOutlinePresentationChartBar size={13} />
                  <span>Box</span>
               </button>

               <button
                  type="button"
                  onClick={() => setTool("circle")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                     tool === "circle" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Circle / Node"
               >
                  <span className="text-xs font-mono font-bold">◯</span>
                  <span>Circle</span>
               </button>

               <button
                  type="button"
                  onClick={() => setTool("arrow")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                     tool === "arrow" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Arrow Connector"
               >
                  <HiArrowRight size={13} />
                  <span>Arrow</span>
               </button>

               <button
                  type="button"
                  onClick={() => setTool("text")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                     tool === "text" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Click anywhere to add Text label"
               >
                  <span className="font-mono font-bold">T</span>
                  <span>Text</span>
               </button>

               <button
                  type="button"
                  onClick={() => setTool("sticky")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                     tool === "sticky" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Click to drop Sticky Note card"
               >
                  <HiAnnotation size={13} />
                  <span>Sticky Note</span>
               </button>

               <button
                  type="button"
                  onClick={() => setTool("eraser")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                     tool === "eraser" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Eraser Tool"
               >
                  <HiX size={13} />
                  <span>Eraser</span>
               </button>
            </div>

            {/* Stroke Size, Colors, Fill & Grid Control */}
            <div className="flex flex-wrap items-center gap-3">
               {/* Size Selector */}
               <div className="flex items-center gap-1 text-xs text-zinc-400 font-semibold">
                  <span className="text-[10px] uppercase font-mono text-zinc-500">Size:</span>
                  {[2, 4, 8, 14].map((s) => (
                     <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`h-6 w-6 rounded-lg font-mono text-[10px] font-bold border transition ${
                           size === s ? "bg-[#f9ebae] text-zinc-950 border-[#f9ebae]" : "bg-zinc-900 border-zinc-800 text-zinc-300"
                        }`}
                     >
                        {s}
                     </button>
                  ))}
               </div>

               <div className="h-4 w-px bg-zinc-800" />

               {/* Color Swatches */}
               <div className="flex items-center gap-1.5">
                  {COLORS.map((swatch) => (
                     <button
                        key={swatch}
                        type="button"
                        onClick={() => setColor(swatch)}
                        className={`h-5 w-5 rounded-full border-2 transition ${
                           color === swatch ? "border-[#f9ebae] scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: swatch }}
                     />
                  ))}
               </div>

               {/* Sticky Note BG Color Selector (When Sticky tool active) */}
               {tool === "sticky" && (
                  <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
                     <span className="text-[10px] text-zinc-400 font-mono">Note Color:</span>
                     {STICKY_BG_COLORS.map((sBg) => (
                        <button
                           key={sBg}
                           type="button"
                           onClick={() => setStickyColor(sBg)}
                           className={`h-4 w-4 rounded-full border ${stickyColor === sBg ? "border-zinc-950 scale-110" : "border-transparent"}`}
                           style={{ backgroundColor: sBg }}
                        />
                     ))}
                  </div>
               )}

               <div className="h-4 w-px bg-zinc-800" />

               {/* Shape Fill Toggle */}
               <button
                  type="button"
                  onClick={() => setIsFilled(!isFilled)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                     isFilled ? "bg-amber-400/20 text-amber-300 border-amber-400/40" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}
                  title="Toggle shape fill style"
               >
                  {isFilled ? "Filled Shape" : "Outline Only"}
               </button>

               {/* Grid Pattern Toggle */}
               <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1.5 rounded-lg border text-xs transition ${
                     showGrid ? "bg-zinc-900 border-zinc-700 text-zinc-200" : "bg-zinc-950 border-zinc-800 text-zinc-500"
                  }`}
                  title="Toggle Grid pattern background"
               >
                  <HiViewGrid size={14} />
               </button>

               {/* Zoom Controls */}
               <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <button onClick={() => setZoom((v) => Math.max(0.5, v - 0.1))} className="p-1 hover:text-white" title="Zoom out"><HiZoomOut size={14} /></button>
                  <span className="font-mono text-zinc-300 w-8 text-center">{zoom.toFixed(1)}x</span>
                  <button onClick={() => setZoom((v) => Math.min(3, v + 0.1))} className="p-1 hover:text-white" title="Zoom in"><HiZoomIn size={14} /></button>
                  <button onClick={() => setZoom(1)} className="p-1 hover:text-white" title="Reset Zoom"><HiRefresh size={14} /></button>
               </div>

               <div className="h-4 w-px bg-zinc-800" />

               <button
                  type="button"
                  onClick={() => {
                     if (window.confirm("Clear all strokes and canvas elements?")) {
                        const cleared = { strokes: [], shapes: [], notes: [], texts: [] };
                        setBoardData(cleared);
                        pushHistoryState(cleared);
                     }
                  }}
                  className="px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition"
               >
                  Clear Canvas
               </button>
            </div>
         </div>

         {/* Sync Status Banner */}
         {(message || remoteMessage) && (
            <div className="bg-[#f9ebae]/10 border-b border-[#f9ebae]/20 px-4 py-1 text-xs text-[#f9ebae] font-semibold flex items-center justify-between shrink-0">
               <span>⚡ {message || remoteMessage}</span>
               <button onClick={() => { setMessage(null); setRemoteMessage(null); }} className="text-zinc-400 hover:text-white">✕</button>
            </div>
         )}

         {/* Main Full-Screen Interactive Canvas */}
         <div className="flex-1 min-h-0 relative overflow-hidden bg-zinc-950 saas-grid-bg">
            <svg
               ref={svgRef}
               viewBox="0 0 1000 700"
               className="h-full w-full cursor-crosshair"
               style={{ touchAction: "none", WebkitTapHighlightColor: "transparent" }}
               preserveAspectRatio="xMidYMid meet"
               onContextMenu={(event) => event.preventDefault()}
               onTouchStart={handleTouchStart}
               onTouchMove={handleTouchMove}
               onTouchEnd={handleTouchEnd}
               onTouchCancel={handleTouchEnd}
               onMouseDown={(event) => {
                  event.preventDefault();
                  handlePointerDown(event);
               }}
               onMouseMove={(event) => {
                  event.preventDefault();
                  handlePointerMove(event);
                  if (socketRef.current && activeBoard) {
                     const point = getCanvasPoint(event);
                     socketRef.current.emit("boardCursor", {
                        boardId: activeBoard._id,
                        cursor: point,
                     });
                  }
               }}
               onMouseUp={(event) => {
                  event.preventDefault();
                  handlePointerUp();
               }}
               onMouseLeave={handlePointerUp}
            >
               {/* Grid Pattern Definition */}
               <defs>
                  <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                     <circle cx="2" cy="2" r="1.2" fill="rgba(255, 255, 255, 0.08)" />
                  </pattern>

                  {/* Marker Arrow definition */}
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                     <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                  </marker>
               </defs>

               {/* Background Canvas Layer */}
               <rect x="0" y="0" width="1000" height="700" fill={showGrid ? "url(#dot-grid)" : "transparent"} />

               <g transform={`scale(${zoom})`}>
                  {/* Freehand Strokes & Highlighter */}
                  {(boardData.strokes || []).map((stroke) => (
                     <path
                        key={stroke.id}
                        d={stroke.points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
                        fill="none"
                        stroke={stroke.color}
                        strokeWidth={stroke.size}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={stroke.opacity || 1}
                     />
                  ))}

                  {/* Shapes (Rectangle, Circle, Arrow) */}
                  {(boardData.shapes || []).map((shape) => {
                     if (shape.type === "circle") {
                        const rx = Math.abs(shape.width || 0) / 2;
                        const ry = Math.abs(shape.height || 0) / 2;
                        const cx = shape.x + (shape.width || 0) / 2;
                        const cy = shape.y + (shape.height || 0) / 2;
                        return (
                           <ellipse
                              key={shape.id}
                              cx={cx}
                              cy={cy}
                              rx={rx}
                              ry={ry}
                              fill={shape.isFilled ? `${shape.color}33` : "none"}
                              stroke={shape.color}
                              strokeWidth={shape.size || 2}
                           />
                        );
                     }

                     if (shape.type === "arrow") {
                        return (
                           <line
                              key={shape.id}
                              x1={shape.x}
                              y1={shape.y}
                              x2={shape.x2 || shape.x}
                              y2={shape.y2 || shape.y}
                              stroke={shape.color}
                              strokeWidth={shape.size || 3}
                              markerEnd="url(#arrowhead)"
                           />
                        );
                     }

                     // Rectangle / Box
                     return (
                        <rect
                           key={shape.id}
                           x={Math.min(shape.x, shape.x + (shape.width || 0))}
                           y={Math.min(shape.y, shape.y + (shape.height || 0))}
                           width={Math.abs(shape.width || 0)}
                           height={Math.abs(shape.height || 0)}
                           rx="10"
                           fill={shape.isFilled ? `${shape.color}33` : "none"}
                           stroke={shape.color}
                           strokeWidth={shape.size || 2}
                        />
                     );
                  })}

                  {/* Canvas Text Labels */}
                  {(boardData.texts || []).map((t) => (
                     <text
                        key={t.id}
                        x={t.x}
                        y={t.y}
                        fill={t.color || "#ffffff"}
                        fontSize={t.fontSize || 18}
                        fontWeight="700"
                        fontFamily="sans-serif"
                     >
                        {t.text}
                     </text>
                  ))}

                  {/* Sticky Notes Cards */}
                  {(boardData.notes || []).map((note) => (
                     <g key={note.id} transform={`translate(${note.x}, ${note.y})`}>
                        <rect
                           width={note.width || 120}
                           height={note.height || 120}
                           rx="8"
                           fill={note.bgColor || "#fef08a"}
                           filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.4))"
                        />
                        <foreignObject width={note.width || 120} height={note.height || 120}>
                           <div
                              xmlns="http://www.w3.org/1999/xhtml"
                              className="w-full h-full p-2.5 text-zinc-950 font-sans text-xs font-bold leading-snug overflow-hidden select-none"
                              style={{ wordBreak: "break-word" }}
                           >
                              {note.text}
                           </div>
                        </foreignObject>
                     </g>
                  ))}

                  {/* Multi-user Remote Cursors */}
                  {remoteCursors.map((cursorItem) => (
                     <g key={cursorItem.user.id}>
                        <circle cx={cursorItem.cursor.x} cy={cursorItem.cursor.y} r="8" fill="#f9ebae" />
                        <text x={cursorItem.cursor.x + 12} y={cursorItem.cursor.y + 4} fill="#ffffff" fontSize="12" fontWeight="700">
                           {cursorItem.user.name?.split(" ")[0] || "Teammate"}
                        </text>
                     </g>
                  ))}
               </g>
            </svg>
         </div>
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
