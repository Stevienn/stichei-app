"use client";
import React, { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { z } from "zod";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

type ILoginProps = {
  isLogin: () => void;
};

const LoginModal = ({ isLogin }: ILoginProps) => {
  const [animate, setAnimate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const loginSchema = z.object({
    email: z.email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
  });

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    const result = loginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      setEmailError("");
      setPasswordError("");

      result.error.issues.forEach((err) => {
        if (err.path[0] === "email") {
          setEmailError(err.message);
        }

        if (err.path[0] === "password") {
          setPasswordError(err.message);
        }
      });

      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      const q = query(
        collection(db, "users"), //ambil collection users
        where("email", "==", user.email)
      );

      const querySnapshot = await getDocs(q); //ambil semua documents sesuai query

      let fullname = "";

      querySnapshot.forEach((doc) => {
        fullname = doc.data().fullname;
      });

      setUser({
        uid: user.uid,
        email: user?.email,
        fullname: fullname,
      });
      //store to zustand

      console.log("masuk berhasil !");
      isLogin();
      router.push("/");
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        alert("Email atau Password salah");
      } else {
        console.log("masuk sini else");
        console.log(error.code);
        alert("Login Gagal");
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          animate ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative flex flex-col rounded-4xl w-[600px] bg-white
          transform transition-all duration-300 ease-out
          ${
            animate
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-90 opacity-0 translate-y-4"
          }`}
      >
        <div className="bg-gradient-to-r from-blue-800 to-blue-400 w-full px-[40px] py-[20px] rounded-t-4xl flex items-center justify-between">
          <h1 className="font-lalezar text-white text-[35px] items-center mt-[10px]">
            Welcome Back !
          </h1>
          <CloseIcon
            fontSize="large"
            sx={{ color: "white", cursor: "pointer" }}
            onClick={isLogin}
          />
        </div>

        <div className="px-[40px] py-[25px]">
          <div className="mb-[15px]">
            <p className="font-inter font-bold mb-[5px] text-[18px]">Email</p>
            <TextField
              id="email"
              value={email}
              variant="outlined"
              placeholder="Insert your email here ..."
              fullWidth
              sx={{
                "& input::placeholder": {
                  fontSize: "15px",
                },
              }}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
            />
          </div>
          <div className="mb-[5px]">
            <p className="font-inter font-bold mb-[5px] text-[18px]">
              Password
            </p>
            <TextField
              id="password"
              value={password}
              variant="outlined"
              placeholder="Insert your password ..."
              type={showPassword ? "text" : "password"}
              fullWidth
              sx={{
                "& input::placeholder": {
                  fontSize: "15px",
                },
              }}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </div>
          <FormControlLabel
            control={<Checkbox />}
            label="Remember me"
            sx={{
              "& .MuiFormControlLabel-label": {
                fontFamily: "var(--font-inter-sans)",
                fontSize: "15px",
                marginTop: "2px",
              },
              "& .MuiSvgIcon-root": { fontSize: 20 },
            }}
          />
        </div>
        <Button
          variant="contained"
          sx={{
            fontFamily: "var(--font-inter-sans)",
            marginX: "40px",
            bgcolor: "blue-900",
            marginBottom: "40px",
          }}
          onClick={handleLogin}
        >
          Log In
        </Button>
      </div>
    </div>
  );
};

export default LoginModal;
