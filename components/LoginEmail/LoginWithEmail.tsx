import React from "react";
import { FaEnvelope } from "react-icons/fa";

const LoginWithEmail = () => {
    return (
        <div className="flex items-center gap-2 justify-center border border-slate-200 py-3 hover:shadow-sm px-2 rounded-2xl">
            <h1 className="text-sm font-semibold text-slate-700">سجل عن طريق البريد الإلكتروني</h1>
            <FaEnvelope className="text-xl text-pro-max" />

        </div>
    );
};

export default LoginWithEmail;