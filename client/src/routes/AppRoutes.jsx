import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Chat from "../pages/Chat/Chat";
import Docs from "../pages/Docs/Docs";
import People from "../pages/People/People";
import Whiteboard from "../pages/Whiteboard/Whiteboard";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import MyChannels from "../pages/MyChannels/MyChannels";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Layout from "../components/common/Layout";

export default function AppRoutes() {
   return (
      <BrowserRouter>
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
               <Route path="/my-channels" element={<MyChannels />} />
               <Route path="/people" element={<People />} />
               <Route path="/whiteboard" element={<Whiteboard />} />
               <Route path="/profile" element={<Profile />} />
               <Route path="/settings" element={<Settings />} />
            </Route>
         </Routes>
      </BrowserRouter>
   );
}
