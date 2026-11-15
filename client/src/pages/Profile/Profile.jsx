import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiPhotograph, HiUserCircle, HiPencil, HiLogout, HiCheck, HiShieldCheck, HiMail } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileService";
import { getMe } from "../../services/authService";
import { PageShell } from "../../components/common/PageShell";
import { uploadProfileAvatar } from "../../services/profileAvatarService";
import { getAvatarSrc } from "../../utils/avatar";

const emptyProfile = { name: "", email: "", avatar: "", bio: "" };

function normalizeProfile(value = {}) {
   return {
      name: value.name || "",
      email: value.email || "",
      avatar: value.avatar || "",
      bio: value.bio || "",
   };
}

export default function Profile() {
   const { setUser, setWorkspace } = useAuth();
   const navigate = useNavigate();
   const [profile, setProfile] = useState(emptyProfile);
   const [editProfile, setEditProfile] = useState(emptyProfile);
   const [message, setMessage] = useState(null);
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);
   const [isEditing, setIsEditing] = useState(false);

   useEffect(() => {
      const load = async () => {
         try {
            const res = await getMe();
            const nextProfile = normalizeProfile(res.data.user);
            setProfile(nextProfile);
            setEditProfile(nextProfile);
         } finally {
            setLoading(false);
         }
      };
      load();
   }, []);

   const avatarSrc = getAvatarSrc(profile);

   const handleAvatarUpload = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setMessage(null);
      setUploading(true);
      try {
         const res = await uploadProfileAvatar(file);
         const nextAvatar = res.data.file?.secure_url || res.data.file?.url || editProfile.avatar;
         setEditProfile((current) => ({ ...current, avatar: nextAvatar }));
      } catch (err) {
         setMessage(err.response?.data?.message || "Unable to upload avatar.");
      } finally {
         setUploading(false);
         event.target.value = "";
      }
   };

   const handleStartEdit = () => {
      setMessage(null);
      setEditProfile(normalizeProfile(profile));
      setIsEditing(true);
   };

   const handleCancelEdit = () => {
      setEditProfile(normalizeProfile(profile));
      setIsEditing(false);
      setMessage(null);
   };

   const handleSave = async (e) => {
      e.preventDefault();
      try {
         const res = await updateProfile({ name: editProfile.name, bio: editProfile.bio, avatar: editProfile.avatar });
         const nextProfile = normalizeProfile(res.data.user);
         setProfile(nextProfile);
         setEditProfile(nextProfile);
         setUser(res.data.user);
         setIsEditing(false);
         setMessage("Profile updated successfully.");
      } catch (err) {
         setMessage(err.response?.data?.message || "Unable to save profile.");
      }
   };

   const handleLogout = () => {
      localStorage.removeItem("token");
      setUser(null);
      setWorkspace(null);
      navigate("/login");
   };

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center py-28 text-sm text-neutral-400 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            <span>Loading profile...</span>
         </div>
      );
   }

   return (
      <PageShell
         title="Personal Profile"
         subtitle="Manage your identity, personal bio, and account credentials."
         actions={
            <div className="flex items-center gap-3">
               {!isEditing ? (
                  <button
                     type="button"
                     onClick={handleStartEdit}
                     className="btn-white flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
                  >
                     <HiPencil size={15} />
                     <span>Edit Profile</span>
                  </button>
               ) : null}
               <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-dark flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
               >
                  <HiLogout size={15} />
                  <span>Sign Out</span>
               </button>
            </div>
         }
      >
         {!isEditing ? (
            <div className="space-y-6 sm:space-y-8">
               {/* User Big Hero Banner Card */}
               <div className="big-card p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 sm:gap-8 bg-gradient-to-b from-[#0e0e11] to-[#070709]">
                  <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                     <div className="relative">
                        <img
                           src={avatarSrc}
                           alt={profile.name || profile.email}
                           className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-2 border-white/20 object-cover shadow-2xl"
                        />
                        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-white border-2 border-black" />
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                           <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                              {profile.name || "Workspace Member"}
                           </h2>
                           <span className="badge-bw px-3 py-1 text-xs font-mono">
                              ACTIVE
                           </span>
                        </div>
                        <p className="text-sm text-neutral-400 font-mono">{profile.email}</p>
                        <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed pt-1">
                           {profile.bio || "No biography provided yet. Click 'Edit Profile' to introduce yourself to your workspace teammates."}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Profile Info Big Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="big-card p-6 sm:p-7 space-y-2">
                     <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Display Name</span>
                     <p className="text-base sm:text-lg font-bold text-white mt-1">{profile.name || "—"}</p>
                     <p className="text-xs text-neutral-500">Your public identity in channel messages and team rosters.</p>
                  </div>

                  <div className="big-card p-6 sm:p-7 space-y-2">
                     <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Account Email</span>
                     <p className="text-base sm:text-lg font-bold text-white mt-1 font-mono">{profile.email || "—"}</p>
                     <p className="text-xs text-neutral-500">Used for signing in and direct message mentions.</p>
                  </div>
               </div>

               {/* Bio Big Card */}
               <div className="big-card p-6 sm:p-7 space-y-3">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Biography & Focus</span>
                  <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-normal">
                     {profile.bio || "Share details about your projects, role, or working hours."}
                  </p>
               </div>

               {message ? (
                  <div className="p-4 rounded-xl border border-white/20 bg-white/10 text-xs font-bold text-white">
                     {message}
                  </div>
               ) : null}
            </div>
         ) : (
            <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
               {/* Avatar Editor Big Card */}
               <div className="big-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                     <img
                        src={getAvatarSrc(editProfile)}
                        alt="Avatar Preview"
                        className="h-20 w-20 rounded-2xl border-2 border-white/20 object-cover shadow-lg"
                     />
                     <div>
                        <h3 className="text-base font-bold text-white">Avatar Photograph</h3>
                        <p className="text-xs text-neutral-400 mt-1">Upload a crisp square photo (PNG, JPG).</p>
                     </div>
                  </div>
                  <label className="btn-dark cursor-pointer px-5 py-3 text-xs font-bold transition flex items-center gap-2">
                     <HiPhotograph className="h-4 w-4" />
                     <span>{uploading ? "Uploading..." : "Upload New Photo"}</span>
                     <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
               </div>

               {/* Form Fields Big Card */}
               <div className="big-card p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Display Name</label>
                        <input
                           className="mt-2 w-full rounded-xl border border-white/15 bg-[#121214] px-4 py-3 text-sm text-white focus:border-white outline-none transition"
                           value={editProfile.name}
                           onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                           placeholder="Your full name"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Account Email</label>
                        <input
                           className="mt-2 w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-neutral-400 font-mono outline-none cursor-not-allowed"
                           value={editProfile.email}
                           readOnly
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Bio & Status</label>
                     <textarea
                        className="mt-2 w-full rounded-xl border border-white/15 bg-[#121214] p-4 text-sm text-white focus:border-white outline-none transition"
                        rows={4}
                        value={editProfile.bio}
                        onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                        placeholder="Tell your team what you're working on..."
                     />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                     <div className="flex gap-3">
                        <button type="submit" className="btn-white px-6 py-2.5 text-xs font-bold">
                           Save Changes
                        </button>
                        <button type="button" onClick={handleCancelEdit} className="btn-dark px-5 py-2.5 text-xs font-bold text-neutral-400 hover:text-white">
                           Cancel
                        </button>
                     </div>
                     {message ? <div className="text-xs font-bold text-white">{message}</div> : null}
                  </div>
               </div>
            </form>
         )}
      </PageShell>
   );
}
