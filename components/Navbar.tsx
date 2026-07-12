"use client";
import CateNavbar from "./cateNavbar";
import HeaderAdsSlider from "./HeaderAdsSlider";
// import LangNavbar from "./langNavbar";
import SearchNavbar from "./searchNavbar";

export default function Navbar() {
	return (
		<div className="fixed top-0 start-0 end-0 z-[10000] w-full border-b backdrop-blur-xl" style={{ background: "var(--nav-background)", borderColor: "var(--nav-border)" }}>
			<HeaderAdsSlider />
			<SearchNavbar />
			<CateNavbar />
		</div>
	);
}
