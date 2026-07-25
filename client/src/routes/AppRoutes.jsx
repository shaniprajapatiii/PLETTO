import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Layout from "../components/common/Layout";

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Chat = lazy(() => import("../pages/Chat/Chat"));
const Docs = lazy(() => import("../pages/Docs/Docs"));
const People = lazy(() => import("../pages/People/People"));
const Whiteboard = lazy(() => import("../pages/Whiteboard/Whiteboard"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const MyChannels = lazy(() => import("../pages/MyChannels/MyChannels"));
const DM = lazy(() => import("../pages/DM/DM"));

export default function AppRoutes() {
   return (
      <BrowserRouter>
         <Suspense fallback={<div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">Loading...</div>}>
            <Routes>
               <Route path="/" element={<Landing />} />
               <Route path="/login" element={<Login />} />
               <Route path="/register" element={<Register />} />

               <Route
                  element={
                     <ProtectedRoute>
                        <Layout />
                     </ProtectedRoute>
                  }
               >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/dm" element={<DM />} />
                  <Route path="/my-channels" element={<MyChannels />} />
                  <Route path="/people" element={<People />} />
                  <Route path="/whiteboard" element={<Whiteboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
               </Route>
            </Routes>
         </Suspense>
      </BrowserRouter>
   );
}
