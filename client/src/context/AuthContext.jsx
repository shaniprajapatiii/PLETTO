import { createContext, useContext, useEffect, useState } from "react";

import { getMe } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [workspace, setWorkspace] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchUser = async () => {
         try {
            const res = await getMe();
            setUser(res.data.user);
            setWorkspace(res.data.workspace);
         } catch {
            setUser(null);
            setWorkspace(null);
         } finally {
            setLoading(false);
         }
      };

      fetchUser();
   }, []);

   return (
      <AuthContext.Provider
         value={{
            user,
            setUser,
            workspace,
            setWorkspace,
            loading,
         }}
      >
         {children}
      </AuthContext.Provider>
   );
};

export const useAuth = () => useContext(AuthContext);
