import React from "react";
import { FaXTwitter } from "react-icons/fa6";
const LoginWithX = () => {
    return (
        <div className="flex items-center gap-2 justify-center border border-slate-200 py-3 hover:shadow-sm px-2 rounded-2xl">
            <h1 className="text-sm font-semibold text-slate-700"> تويتر </h1>
            <FaXTwitter className="text-xl text-pro-max" />

        </div>
    );
};

export default LoginWithX;