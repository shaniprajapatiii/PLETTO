import { useState } from "react";

import { loginUser } from "../../services/authService";

import { useNavigate } from "react-router-dom";

export default function Login() {
   const navigate = useNavigate();

   const [form, setForm] = useState({
      email: "",
      password: "",
   });

   const submit = async (e) => {
      e.preventDefault();

      try {
         const res = await loginUser(form);

         localStorage.setItem("token", res.data.token);

         navigate("/dashboard");
      } catch (err) {
         console.log(err);
      }
   };

   return (
      <div>
         <h1>Login</h1>

         <form onSubmit={submit}>
            <input
               type="email"
               placeholder="Email"
               onChange={(e) =>
                  setForm({
                     ...form,
                     email: e.target.value,
                  })
               }
            />

            <input
               type="password"
               placeholder="Password"
               onChange={(e) =>
                  setForm({
                     ...form,
                     password: e.target.value,
                  })
               }
            />

            <button>Login</button>
         </form>
      </div>
   );
}
